import { useState } from 'react'
import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Down, RotatingArrow } from '@carbonplan/icons'
import { DATA_URLS } from '@/lib/config'
import { useStore } from '@/lib/store'
import { getGeoid } from '@/lib/risk-utils'

interface DownloadProps {
  geography: 'censusTract' | 'county'
  disabled?: boolean
}

export const Download = ({ disabled, geography }: DownloadProps) => {
  const [showModal, setShowModal] = useState(false)
  const activeGeographyId = useStore((state) =>
    getGeoid(state.activeGeographies[geography]),
  )

  const handleDownload = (format: 'csv' | 'geojson') => {
    const url = `${DATA_URLS.downloads}${geography}/${format}/${activeGeographyId}.${format}`
    window.open(url, '_blank')
    setShowModal(false)
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Button
        size='xs'
        onClick={() => setShowModal(!showModal)}
        inverted
        suffix={<Down />}
        sx={disabled ? { pointerEvents: 'none' } : undefined}
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
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 3 }}
            >
              <Button
                size='xs'
                suffix={<RotatingArrow />}
                onClick={() => handleDownload('csv')}
              >
                CSV
              </Button>
              <Button
                size='xs'
                suffix={<RotatingArrow />}
                onClick={() => handleDownload('geojson')}
              >
                GeoJSON
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}
