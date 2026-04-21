import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Spinner } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Down, X } from '@carbonplan/icons'
import { DATA_VERSION, DATA_URLS, LICENSE_INFO } from '@/lib/config'
import { useStore } from '@/lib/store'
import { getGeographyName, getGeoid } from '@/lib/risk-utils'
import { GeographyKey } from '@/types/location'
import useTracking from '@/hooks/useTracking'
import { getDuckDB } from '@/lib/duckdb'

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

const S3_BUCKET = new URL(DATA_URLS.parquetBase).origin

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

// Single source of truth for CSV output columns: [header-name, sql-expression].
// Score columns are cast to FLOAT because DuckDB-WASM otherwise promotes them
// to DOUBLE in the COPY pipeline.
const CSV_COLUMNS: [string, string][] = [
  ['GEOID', 'GEOID'],
  ['longitude', 'ROUND(ST_X(ST_Centroid(geometry)), 6)'],
  ['latitude', 'ROUND(ST_Y(ST_Centroid(geometry)), 6)'],
  ['rps_2011', 'rps_2011::FLOAT'],
  ['rps_2047', 'rps_2047::FLOAT'],
  ['bp_2011', 'bp_2011::FLOAT'],
  ['bp_2047', 'bp_2047::FLOAT'],
  ['crps_scott', 'crps_scott::FLOAT'],
  ['bp_2011_riley', 'bp_2011_riley::FLOAT'],
  ['bp_2047_riley', 'bp_2047_riley::FLOAT'],
]
const CSV_SELECT = CSV_COLUMNS.map(([name, expr]) => `${expr} AS ${name}`).join(
  ', ',
)
const CSV_HEADER = CSV_COLUMNS.map(([name]) => name).join(',') + '\n'

function trimGeoid(geoid: string, regionType: string): string {
  if (regionType === 'county') return geoid.slice(0, 5)
  if (regionType === 'tract') return geoid.slice(0, 11)
  return geoid
}

async function getPartitionUrls(
  geoid: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const stateFips = geoid.slice(0, 2)
  const countyFips = geoid.slice(2, 5)
  const prefix = DATA_URLS.parquetBase.replace(S3_BUCKET + '/', '')
  const partitionPrefix = `${prefix}/state_fips=${stateFips}/county_fips=${countyFips}/`

  const res = await fetch(
    `${S3_BUCKET}/?list-type=2&prefix=${partitionPrefix}`,
    { signal },
  )
  const doc = new DOMParser().parseFromString(
    await res.text(),
    'application/xml',
  )

  const urls: string[] = []
  for (const el of doc.querySelectorAll('Contents > Key')) {
    const key = el.textContent
    if (key?.endsWith('.parquet')) urls.push(`${S3_BUCKET}/${key}`)
  }

  if (urls.length === 0) {
    throw new Error(
      `No data found for state=${stateFips}, county=${countyFips}`,
    )
  }
  return urls
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

// One COPY per partition file, pulled out of the VFS between iterations —
// keeps DuckDB's working set bounded by a single partition so very large
// counties (e.g. LA) don't blow the WASM heap.
async function copyParquetTo(
  geoid: string,
  regionType: string,
  select: string,
  formatClause: string,
  signal?: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>[]> {
  const [db, partitionUrls] = await Promise.all([
    getDuckDB(),
    getPartitionUrls(geoid, signal),
  ])
  signal?.throwIfAborted()
  const conn = await db.connect()
  const trimmedGeoid = trimGeoid(geoid, regionType)
  // Per-call UUID so concurrent downloads (e.g. CSV + GeoJSON at once) can't
  // collide on VFS paths.
  const runId = crypto.randomUUID()
  // Best-effort interrupt the in-flight query when abort fires.
  const onAbort = () => {
    conn.cancelSent().catch(() => {})
  }
  signal?.addEventListener('abort', onAbort)

  try {
    const chunks: Uint8Array<ArrayBuffer>[] = []
    for (let i = 0; i < partitionUrls.length; i++) {
      signal?.throwIfAborted()
      const outPath = `/tmp/dl-${runId}-${i}.out`
      try {
        await conn.query(`
          COPY (
            SELECT ${select}
            FROM read_parquet('${partitionUrls[i]}')
            WHERE GEOID LIKE '${trimmedGeoid}%'
          ) TO '${outPath}' (${formatClause})
        `)
        // If abort fired during the query, surface as AbortError rather than
        // whatever DuckDB threw from cancelSent.
        signal?.throwIfAborted()
        const chunk = await db.copyFileToBuffer(outPath)
        if (chunk.length > 0) {
          chunks.push(chunk as Uint8Array<ArrayBuffer>)
        }
      } finally {
        try {
          await db.dropFile(outPath)
        } catch {
          // ignore cleanup errors
        }
      }
    }
    if (chunks.length === 0) {
      throw new Error(`No building data found for GEOID: ${trimmedGeoid}`)
    }
    return chunks
  } finally {
    signal?.removeEventListener('abort', onAbort)
    await conn.close()
  }
}

async function downloadCSV(
  geoid: string,
  regionType: string,
  filename: string,
  signal?: AbortSignal,
) {
  const chunks = await copyParquetTo(
    geoid,
    regionType,
    CSV_SELECT,
    'FORMAT CSV, HEADER false',
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
  triggerBlobDownload(
    new Blob([metadata, CSV_HEADER, ...chunks], { type: 'text/csv' }),
    `${filename}.csv`,
  )
}

async function downloadGeoJSON(
  geoid: string,
  regionType: string,
  filename: string,
  signal?: AbortSignal,
) {
  // Build each GeoJSON Feature entirely in SQL via ST_AsGeoJSON + to_json,
  // then COPY TO streams them to the VFS — no JS JSON parsing needed.
  const chunks = await copyParquetTo(
    geoid,
    regionType,
    // Build properties manually so FLOAT::VARCHAR gives the same precision
    // as the CSV output. to_json would promote FLOATs to DOUBLE precision.
    // COALESCE to 'null' so a NULL column doesn't nullify the whole feature.
    `'{"type":"Feature","geometry":' || ST_AsGeoJSON(ST_ReducePrecision(ST_Centroid(geometry), 0.000001))
      || ',"properties":{"GEOID":"' || GEOID
      || '","rps_2011":' || COALESCE(rps_2011::FLOAT::VARCHAR, 'null')
      || ',"rps_2047":' || COALESCE(rps_2047::FLOAT::VARCHAR, 'null')
      || ',"bp_2011":' || COALESCE(bp_2011::FLOAT::VARCHAR, 'null')
      || ',"bp_2047":' || COALESCE(bp_2047::FLOAT::VARCHAR, 'null')
      || ',"crps_scott":' || COALESCE(crps_scott::FLOAT::VARCHAR, 'null')
      || ',"bp_2011_riley":' || COALESCE(bp_2011_riley::FLOAT::VARCHAR, 'null')
      || ',"bp_2047_riley":' || COALESCE(bp_2047_riley::FLOAT::VARCHAR, 'null')
      || '}},' AS feature`,
    `FORMAT CSV, HEADER false, QUOTE E'\\x01', DELIMITER E'\\x02'`,
    signal,
  )

  // Each chunk is one Feature JSON per line, each with trailing comma.
  // Strip the last comma from the final chunk and wrap with FeatureCollection.
  const last = chunks[chunks.length - 1]
  let end = last.length - 1
  while (end > 0 && last[end] !== 44) end-- // find last comma (0x2C)
  // subarray is a view (slice would copy). Cast narrows ArrayBufferLike →
  // ArrayBuffer so BlobPart accepts it.
  chunks[chunks.length - 1] = last.subarray(0, end) as Uint8Array<ArrayBuffer>

  const metadata = JSON.stringify({
    dataset_version: DATA_VERSION,
    provider: LICENSE_INFO.provider,
    license: `${LICENSE_INFO.licenseName} (${LICENSE_INFO.licenseUrl})`,
    terms_of_access: LICENSE_INFO.termsOfAccess,
    data_sources: LICENSE_INFO.dataSources,
    notice: LICENSE_INFO.notice,
  })

  triggerBlobDownload(
    new Blob(
      [
        `{"type":"FeatureCollection","metadata":${metadata},"features":[\n`,
        ...chunks,
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
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])
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
      abortRef.current?.abort()
      setLoading((prev) => ({ ...prev, [format]: false }))
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

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

      if (format === 'csv') {
        await downloadCSV(geoid, regionType, filename, controller.signal)
      } else {
        await downloadGeoJSON(geoid, regionType, filename, controller.signal)
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
      if (abortRef.current === controller) abortRef.current = null
      setLoading((prev) => ({ ...prev, [format]: false }))
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
