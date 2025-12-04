import { useState } from 'react'
import { Flex, Spinner } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Down } from '@carbonplan/icons'
import { DATA_URLS, DATA_VERSION } from '@/lib/config'
import { useStore } from '@/lib/store'
import { getCountyName, getGeoid } from '@/lib/risk-utils'
import { GeographyKey } from '@/types/location'
import useTracking from '@/hooks/useTracking'

const DownloadButton = ({
  label,
  loading,
  disabled,
  onClick,
  ariaLabel,
}: {
  label: string
  loading: boolean
  disabled?: boolean
  onClick: () => void
  ariaLabel?: string
}) => {
  return (
    <Button
      size='xs'
      suffix={loading ? <Spinner sx={{ mt: -1 }} /> : <Down sx={{ mt: -1 }} />}
      disabled={loading || disabled}
      onClick={onClick}
      aria-label={ariaLabel || label}
      sx={{
        color: loading ? 'secondary' : disabled ? 'muted' : 'secondary',
        '&:hover': {
          color: loading ? 'secondary' : disabled ? 'muted' : 'primary',
        },
        '&:disabled': { pointerEvents: 'none' },
      }}
    >
      {label}
    </Button>
  )
}

const REGION_TYPES: Record<GeographyKey, string> = {
  county: 'county',
  censusTract: 'tract',
  censusBlock: 'block',
}

export const Download = () => {
  const track = useTracking()
  const [loading, setLoading] = useState({ csv: false, gpkg: false })
  const selectedGeographyLevel = useStore(
    (state) => state.selectedGeographyLevel,
  )
  const geoid = useStore((state) =>
    getGeoid(state.activeGeographies[selectedGeographyLevel]),
  )
  const countyName = useStore((state) =>
    getCountyName(state.activeGeographies.county),
  )
  const activeGeographies = useStore((state) => state.activeGeographies)
  const disabled = !activeGeographies[selectedGeographyLevel]
  let filename: string
  if (selectedGeographyLevel === 'county') {
    filename = `${countyName?.replaceAll(' ', '-')}-County-${geoid}`
  } else if (selectedGeographyLevel === 'censusTract') {
    filename = `Census-Tract-${geoid}`
  } else {
    filename = `Census-Block-${geoid}`
  }

  const handleClick = async (format: 'csv' | 'gpkg') => {
    setLoading((prev) => ({ ...prev, [format]: true }))
    try {
      track('data_download', {
        geography: selectedGeographyLevel,
        geoid: geoid ?? '',
      })
      const res = await fetch(DATA_URLS.downloads, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: process.env.NEXT_PUBLIC_OCR_ENV ?? 'production',
          dataset_version: DATA_VERSION,
          data_format: format,
          geoid: geoid,
          region_type: REGION_TYPES[selectedGeographyLevel],
          file_name: `${filename}.${format}`,
        }),
      })
      const payload = await res.json()
      if (!payload?.url) {
        throw Error('Error generating download')
      }

      const a = document.createElement('a')
      a.href = payload.url
      a.download = `${filename}.${format}` // explicitly trigger download and suggest filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setLoading((prev) => ({ ...prev, [format]: false }))
    } catch {
      track('data_download_error', {
        geography: selectedGeographyLevel,
        geoid: geoid ?? '',
      })
      setLoading((prev) => ({ ...prev, [format]: false }))
    }
  }

  return (
    <Flex sx={{ gap: 3 }} role='group' aria-label='Download regional data'>
      <DownloadButton
        label='CSV'
        loading={loading.csv}
        disabled={disabled}
        onClick={() => handleClick('csv')}
        ariaLabel={`Download ${disabled ? 'regional' : selectedGeographyLevel} data as CSV`}
      />
      <DownloadButton
        label='GeoPackage'
        loading={loading.gpkg}
        disabled={disabled}
        onClick={() => handleClick('gpkg')}
        ariaLabel={`Download ${disabled ? 'regional' : selectedGeographyLevel} data as GeoPackage`}
      />
    </Flex>
  )
}
