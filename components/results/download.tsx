import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Spinner } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Down, X } from '@carbonplan/icons'
import { DATA_VERSION, DATA_URLS, LICENSE_INFO } from '@/lib/config'
import { useStore } from '@/lib/store'
import { getBoundingBox, getGeographyName, getGeoid } from '@/lib/risk-utils'
import { GeographyKey } from '@/types/location'
import useTracking from '@/hooks/useTracking'
import type { Bbox, DownloadRow } from '@/lib/region-download'

export const DownloadButton = ({
  label,
  loading,
  disabled,
  onClick,
  ariaLabel,
  href,
  showSuffix = true,
}: {
  label: string
  loading: boolean
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
  href?: string
  showSuffix?: boolean
}) => {
  const [hovered, setHovered] = useState(false)
  const [keyboardFocused, setKeyboardFocused] = useState(false)
  const showCancel = loading && (hovered || keyboardFocused)

  let suffix
  if (showSuffix) {
    if (loading) {
      suffix = showCancel ? <X sx={{ mt: -1 }} /> : <Spinner sx={{ mt: -1 }} />
    } else {
      suffix = <Down sx={{ mt: -1 }} />
    }
  }
  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(':focus-visible')) {
          setKeyboardFocused(true)
        }
      }}
      onBlur={() => setKeyboardFocused(false)}
      sx={{ display: 'inline-block' }}
    >
      <Button
        size='xs'
        suffix={suffix}
        disabled={disabled}
        onClick={onClick}
        href={href}
        aria-label={ariaLabel || label}
        sx={{
          '&:disabled': {
            pointerEvents: 'none',
            color: 'muted',
          },
        }}
      >
        {label}
      </Button>
    </Box>
  )
}

const REGION_TYPES: Partial<Record<GeographyKey, string>> = {
  county: 'county',
  censusTract: 'tract',
  censusBlock: 'block',
}

const DURATION_BUCKETS: [number, string][] = [
  [1000, '<1s'],
  [5000, '1-5s'],
  [15000, '5-15s'],
  [60000, '15-60s'],
  [180000, '1-3m'],
  [300000, '3-5m'],
]
const bucketDuration = (ms: number) =>
  DURATION_BUCKETS.find(([max]) => ms < max)?.[1] ?? '5m+'

function trimGeoid(geoid: string, regionType: string): string {
  if (regionType === 'county') return geoid.slice(0, 5)
  if (regionType === 'tract') return geoid.slice(0, 11)
  return geoid
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Lines for every building in the region, read from the buildings file a row
// group at a time; each row group's lines become one Blob part, which the
// browser can hold outside the JS heap. The reader loads when a download starts.
async function regionParts(
  geoid: string,
  regionType: string,
  bbox: Bbox,
  format: (row: DownloadRow) => string,
  separator: string,
  signal?: AbortSignal,
): Promise<Blob[]> {
  const { regionBuildings } = await import('@/lib/region-download')
  const prefix = trimGeoid(geoid, regionType)
  const parts: Blob[] = []
  for await (const rows of regionBuildings(
    DATA_URLS.vector.buildings,
    prefix,
    bbox,
    signal,
  )) {
    if (!rows.length) continue
    const text = rows.map(format).join(separator)
    parts.push(new Blob([parts.length ? separator : '', text]))
  }
  if (!parts.length)
    throw new Error(`No building data found for GEOID: ${prefix}`)
  return parts
}

async function downloadCSV(
  geoid: string,
  regionType: string,
  bbox: Bbox,
  filename: string,
  signal?: AbortSignal,
) {
  const { csvLine, CSV_HEADER } = await import('@/lib/region-download')
  const lines = await regionParts(
    geoid,
    regionType,
    bbox,
    csvLine,
    '\n',
    signal,
  )

  const metadata = `# OCR Dataset Version: ${DATA_VERSION}
# Provider: ${LICENSE_INFO.provider}
# License: ${LICENSE_INFO.licenseName} (${LICENSE_INFO.licenseUrl})
# Terms of Access: ${LICENSE_INFO.termsOfAccess}
# Data Sources: ${LICENSE_INFO.dataSources}
# Notice: ${LICENSE_INFO.notice}
# ------------------------------------------
`
  // a download cancelled while its last rows arrived is not saved
  signal?.throwIfAborted()
  triggerBlobDownload(
    new Blob([metadata, CSV_HEADER, '\n', ...lines, '\n'], {
      type: 'text/csv',
    }),
    `${filename}.csv`,
  )
}

async function downloadGeoJSON(
  geoid: string,
  regionType: string,
  bbox: Bbox,
  filename: string,
  signal?: AbortSignal,
) {
  const { geojsonFeature } = await import('@/lib/region-download')
  const features = await regionParts(
    geoid,
    regionType,
    bbox,
    geojsonFeature,
    ',\n',
    signal,
  )

  const metadata = JSON.stringify({
    dataset_version: DATA_VERSION,
    provider: LICENSE_INFO.provider,
    license: `${LICENSE_INFO.licenseName} (${LICENSE_INFO.licenseUrl})`,
    terms_of_access: LICENSE_INFO.termsOfAccess,
    data_sources: LICENSE_INFO.dataSources,
    notice: LICENSE_INFO.notice,
  })

  // a download cancelled while its last rows arrived is not saved
  signal?.throwIfAborted()
  triggerBlobDownload(
    new Blob(
      [
        `{"type":"FeatureCollection","metadata":${metadata},"features":[\n`,
        ...features,
        '\n]}',
      ],
      { type: 'application/geo+json' },
    ),
    `${filename}.geojson`,
  )
}

export const Download = () => {
  const track = useTracking()
  const [loading, setLoading] = useState({ csv: false, geojson: false })
  const abortRefs = useRef<Record<'csv' | 'geojson', AbortController | null>>({
    csv: null,
    geojson: null,
  })
  const selectedGeographyLevel = useStore(
    (state) => state.selectedGeographyLevel,
  )
  const geoid = useStore((state) =>
    getGeoid(state.activeGeographies[selectedGeographyLevel]),
  )
  const countyName = useStore((state) =>
    getGeographyName(state.activeGeographies.county),
  )
  const activeGeographies = useStore((state) => state.activeGeographies)
  const isDownloadableLevel =
    selectedGeographyLevel !== 'state' && selectedGeographyLevel !== 'nation'
  const disabled = !activeGeographies[selectedGeographyLevel]

  useEffect(() => {
    return () => {
      abortRefs.current.csv?.abort()
      abortRefs.current.geojson?.abort()
      abortRefs.current.csv = null
      abortRefs.current.geojson = null
      setLoading({ csv: false, geojson: false })
    }
  }, [geoid, selectedGeographyLevel])
  let filename: string
  if (selectedGeographyLevel === 'county') {
    filename = `${countyName?.replaceAll(' ', '-')}-County-${geoid}`
  } else if (selectedGeographyLevel === 'censusTract') {
    filename = `Census-Tract-${geoid}`
  } else {
    filename = `Census-Block-${geoid}`
  }

  const handleClick = async (format: 'csv' | 'geojson') => {
    if (loading[format]) {
      abortRefs.current[format]?.abort()
      setLoading((prev) => ({ ...prev, [format]: false }))
      return
    }
    const controller = new AbortController()
    abortRefs.current[format] = controller

    setLoading((prev) => ({ ...prev, [format]: true }))
    const startTime = performance.now()
    try {
      track('data_download', {
        geography: selectedGeographyLevel,
        geoid: geoid ?? '',
      })

      if (!geoid) throw new Error('No geography selected')

      const regionType = REGION_TYPES[selectedGeographyLevel]
      if (!regionType) throw new Error('Invalid geography level')

      const bbox = getBoundingBox(activeGeographies[selectedGeographyLevel])
      if (!bbox) throw new Error('No bounds for the selected geography')

      if (format === 'csv') {
        await downloadCSV(geoid, regionType, bbox, filename, controller.signal)
      } else {
        await downloadGeoJSON(
          geoid,
          regionType,
          bbox,
          filename,
          controller.signal,
        )
      }
    } catch (error) {
      const isAbort =
        controller.signal.aborted ||
        (error instanceof DOMException && error.name === 'AbortError')
      if (isAbort) {
        track('data_download_cancel', {
          geography: selectedGeographyLevel,
          geoid: geoid ?? '',
          format,
          duration_bucket: bucketDuration(performance.now() - startTime),
        })
      } else {
        track('data_download_error', {
          geography: selectedGeographyLevel,
          geoid: geoid ?? '',
        })
        console.error('Download failed:', error)
      }
    } finally {
      // A newer run for the same format may have replaced this controller —
      // only clear loading/ref when we're still the active run, otherwise the
      // retry gets its state wiped out mid-flight.
      if (abortRefs.current[format] === controller) {
        abortRefs.current[format] = null
        setLoading((prev) => ({ ...prev, [format]: false }))
      }
    }
  }

  if (!isDownloadableLevel) {
    return (
      <DownloadButton
        label='Download not available'
        loading={false}
        disabled
        showSuffix={false}
      />
    )
  }

  return (
    <Flex
      sx={{ gap: 3, flexWrap: 'wrap' }}
      role='group'
      aria-label='Download regional data'
    >
      <DownloadButton
        label='CSV'
        loading={loading.csv}
        disabled={disabled}
        onClick={() => handleClick('csv')}
        ariaLabel={
          loading.csv
            ? 'Cancel CSV download'
            : `Download ${disabled ? 'regional' : selectedGeographyLevel} data as CSV`
        }
      />
      <DownloadButton
        label='GeoJSON'
        loading={loading.geojson}
        disabled={disabled}
        onClick={() => handleClick('geojson')}
        ariaLabel={
          loading.geojson
            ? 'Cancel GeoJSON download'
            : `Download ${disabled ? 'regional' : selectedGeographyLevel} data as GeoJSON`
        }
      />
    </Flex>
  )
}
