import { useState } from 'react'
import { Flex, Spinner } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Down } from '@carbonplan/icons'
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
  let suffix
  if (showSuffix) {
    suffix = <Down sx={{ mt: -1 }} />
    if (loading) {
      suffix = <Spinner sx={{ mt: -1 }} />
    }
  }
  return (
    <Button
      size='xs'
      suffix={suffix}
      disabled={loading || disabled}
      onClick={onClick}
      href={href}
      aria-label={ariaLabel || label}
      sx={{
        '&:disabled': {
          pointerEvents: 'none',
          color: loading ? 'secondary' : 'muted',
        },
      }}
    >
      {label}
    </Button>
  )
}

const REGION_TYPES: Partial<Record<GeographyKey, string>> = {
  county: 'county',
  censusTract: 'tract',
  censusBlock: 'block',
}

const S3_BUCKET = new URL(DATA_URLS.parquetBase).origin

// Cast each score column to FLOAT to match the data's precision —
// DuckDB-WASM otherwise promotes them to DOUBLE in the COPY pipeline
const RISK_COLUMNS = [
  'rps_2011',
  'rps_2047',
  'bp_2011',
  'bp_2047',
  'crps_scott',
  'bp_2011_riley',
  'bp_2047_riley',
]
  .map((c) => `${c}::FLOAT AS ${c}`)
  .join(', ')

function trimGeoid(geoid: string, regionType: string): string {
  if (regionType === 'county') return geoid.slice(0, 5)
  if (regionType === 'tract') return geoid.slice(0, 11)
  return geoid
}

async function getPartitionUrls(geoid: string): Promise<string[]> {
  const stateFips = geoid.slice(0, 2)
  const countyFips = geoid.slice(2, 5)
  const prefix = DATA_URLS.parquetBase.replace(S3_BUCKET + '/', '')
  const partitionPrefix = `${prefix}/state_fips=${stateFips}/county_fips=${countyFips}/`

  const res = await fetch(`${S3_BUCKET}/?list-type=2&prefix=${partitionPrefix}`)
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

// Uses COPY TO so DuckDB streams through its pipeline without
// materializing the full result — avoids the 2GB WASM memory limit.
async function copyParquetTo(
  geoid: string,
  regionType: string,
  select: string,
  outPath: string,
  formatClause: string,
) {
  const [db, partitionUrls] = await Promise.all([
    getDuckDB(),
    getPartitionUrls(geoid),
  ])
  const conn = await db.connect()
  const trimmedGeoid = trimGeoid(geoid, regionType)
  const urlList = partitionUrls.map((u) => `'${u}'`).join(', ')

  try {
    await conn.query(`
      COPY (
        SELECT ${select}
        FROM read_parquet([${urlList}])
        WHERE GEOID LIKE '${trimmedGeoid}%'
      ) TO '${outPath}' (${formatClause})
    `)
    const buffer = await db.copyFileToBuffer(outPath)
    if (buffer.length === 0) {
      throw new Error(`No building data found for GEOID: ${trimmedGeoid}`)
    }
    return buffer
  } finally {
    try {
      await db.dropFile(outPath)
    } catch {
      // ignore cleanup errors
    }
    await conn.close()
  }
}

async function downloadCSV(
  geoid: string,
  regionType: string,
  filename: string,
) {
  const outPath = `/tmp/dl-${geoid}-${Date.now()}.csv`
  const buffer = await copyParquetTo(
    geoid,
    regionType,
    `GEOID,
     ROUND(ST_X(ST_Centroid(geometry)), 6) AS centroid_longitude,
     ROUND(ST_Y(ST_Centroid(geometry)), 6) AS centroid_latitude,
     ${RISK_COLUMNS}`,
    outPath,
    'FORMAT CSV, HEADER',
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
    new Blob([metadata, buffer.slice()], { type: 'text/csv' }),
    `${filename}.csv`,
  )
}

async function downloadGeoJSON(
  geoid: string,
  regionType: string,
  filename: string,
) {
  // Build each GeoJSON Feature entirely in SQL via ST_AsGeoJSON + to_json,
  // then COPY TO streams them to the VFS — no JS JSON parsing needed.
  const outPath = `/tmp/dl-${geoid}-${Date.now()}.jsonl`
  const buffer = await copyParquetTo(
    geoid,
    regionType,
    // Build properties manually so FLOAT::VARCHAR gives the same precision
    // as the CSV output. to_json would promote FLOATs to DOUBLE precision.
    `'{"type":"Feature","geometry":' || ST_AsGeoJSON(ST_ReducePrecision(ST_Centroid(geometry), 0.000001))
      || ',"properties":{"GEOID":"' || GEOID
      || '","rps_2011":' || rps_2011::FLOAT::VARCHAR
      || ',"rps_2047":' || rps_2047::FLOAT::VARCHAR
      || ',"bp_2011":' || bp_2011::FLOAT::VARCHAR
      || ',"bp_2047":' || bp_2047::FLOAT::VARCHAR
      || ',"crps_scott":' || crps_scott::FLOAT::VARCHAR
      || ',"bp_2011_riley":' || bp_2011_riley::FLOAT::VARCHAR
      || ',"bp_2047_riley":' || bp_2047_riley::FLOAT::VARCHAR
      || '}},' AS feature`,
    outPath,
    `FORMAT CSV, HEADER false, QUOTE E'\\x01', DELIMITER E'\\x02'`,
  )

  // Buffer is one Feature JSON per line, each with trailing comma.
  // Strip the last comma and wrap with FeatureCollection — zero-copy via Blob.
  let end = buffer.length - 1
  while (end > 0 && buffer[end] !== 44) end-- // find last comma (0x2C)

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
        buffer.slice(0, end), // features without last comma
        buffer.slice(end + 1), // trailing newline
        ']}',
      ],
      { type: 'application/geo+json' },
    ),
    `${filename}.geojson`,
  )
}

export const Download = () => {
  const track = useTracking()
  const [loading, setLoading] = useState({ csv: false, geojson: false })
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
    setLoading((prev) => ({ ...prev, [format]: true }))
    try {
      track('data_download', {
        geography: selectedGeographyLevel,
        geoid: geoid ?? '',
      })

      if (!geoid) throw new Error('No geography selected')

      const regionType = REGION_TYPES[selectedGeographyLevel]
      if (!regionType) throw new Error('Invalid geography level')

      if (format === 'csv') {
        await downloadCSV(geoid, regionType, filename)
      } else {
        await downloadGeoJSON(geoid, regionType, filename)
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        track('data_download_error', {
          geography: selectedGeographyLevel,
          geoid: geoid ?? '',
        })
      }
      console.error('Download failed:', error)
    } finally {
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
        ariaLabel={`Download ${disabled ? 'regional' : selectedGeographyLevel} data as CSV`}
      />
      <DownloadButton
        label='GeoJSON'
        loading={loading.geojson}
        disabled={disabled}
        onClick={() => handleClick('geojson')}
        ariaLabel={`Download ${disabled ? 'regional' : selectedGeographyLevel} data as GeoJSON`}
      />
    </Flex>
  )
}
