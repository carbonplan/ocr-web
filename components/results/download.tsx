import { useState } from 'react'
import { Box, Spinner } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Down, RotatingArrow } from '@carbonplan/icons'
import { DATA_URLS, DATA_VERSION } from '@/lib/config'
import { useStore } from '@/lib/store'
import { getCountyName, getGeoid } from '@/lib/risk-utils'

interface DownloadProps {
  geography: 'censusTract' | 'county'
  disabled?: boolean
}

const DownloadButton = ({
  label,
  loading,
  onClick,
}: {
  label: string
  loading: boolean
  onClick: () => void
}) => {
  return (
    <Button
      size='xs'
      suffix={loading ? <Spinner sx={{ mt: -1 }} /> : <RotatingArrow />}
      disabled={loading}
      onClick={onClick}
      sx={{
        color: loading ? 'secondary' : 'primary',
        '&:disabled': { pointerEvents: 'none' },
      }}
    >
      {label}
    </Button>
  )
}

const REGION_TYPES = {
  county: 'county',
  censusTract: 'tract',
}

export const Download = ({ disabled, geography }: DownloadProps) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState({ csv: false, gpkg: false })
  const geoid = useStore((state) =>
    getGeoid(state.activeGeographies[geography]),
  )
  const countyName = useStore((state) =>
    getCountyName(state.activeGeographies.county),
  )
  const filename =
    geography === 'county'
      ? `${countyName?.replaceAll(' ', '-')}-County-${geoid}`
      : `Census-Tract-${geoid}`

  const handleClick = async (format: 'csv' | 'gpkg') => {
    setLoading((prev) => ({ ...prev, [format]: true }))
    try {
      const res = await fetch(DATA_URLS.downloads, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: 'staging', // TODO: move to env variable
          dataset_version: DATA_VERSION,
          data_format: format,
          geoid: geoid,
          region_type: REGION_TYPES[geography],
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
      setShowModal(false)
    } catch {
      setLoading((prev) => ({ ...prev, [format]: false }))
    }
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Button
        size='xs'
        onClick={() => setShowModal(!showModal)}
        inverted
        suffix={<Down />}
        sx={disabled ? { pointerEvents: 'none', color: 'muted' } : undefined}
      >
        Download region data
      </Button>

      {showModal && (
        <>
          <Box
            onClick={() => setShowModal(false)}
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
            }}
          />
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              bg: 'background',
              border: '1px solid',
              borderColor: 'muted',
              px: 3,
              pt: 2,
              pb: 3,
              width: '100%',
              zIndex: 10000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Box
              sx={{
                mb: 2,
                fontFamily: 'mono',
                letterSpacing: 'mono',
                textTransform: 'uppercase',
                fontSize: 0,
              }}
            >
              Select format
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DownloadButton
                label='CSV'
                loading={loading.csv}
                onClick={() => handleClick('csv')}
              />
              <DownloadButton
                label='GPKG'
                loading={loading.gpkg}
                onClick={() => handleClick('gpkg')}
              />
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}
