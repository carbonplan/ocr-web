import { useState } from 'react'
import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Down } from '@carbonplan/icons'
import { DATA_URLS } from '@/lib/config'
import { useStore } from '@/lib/store'
import { getGeoid } from '@/lib/risk-utils'

interface DownloadProps {
  geography: 'tract' | 'county'
}

export const Download = ({ geography }: DownloadProps) => {
  const [showModal, setShowModal] = useState(false)
  const activeGeographies = useStore((state) => state.activeGeographies)

  const activeGeographyId =
    geography === 'tract'
      ? getGeoid(activeGeographies.censusTract)
      : getGeoid(activeGeographies.county)

  const handleDownload = (format: 'csv' | 'geojson') => {
    const url = `${DATA_URLS.downloads}${geography}/${format}/${activeGeographyId}.${format}`
    window.open(url, '_blank')
    setShowModal(false)
  }

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Button
        prefix={<Down sx={{ mt: '-4px', height: 10 }} />}
        size='xs'
        onClick={() => setShowModal(!showModal)}
        inverted
        sx={{
          fontFamily: 'mono',
          letterSpacing: 'mono',
          fontSize: [0, 0, 0, 1],
          textTransform: 'uppercase',
        }}
      >
        Download {geography} data
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
              py: 2,
              width: 150,
              zIndex: 10000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Box sx={{ mb: 2, fontSize: 2, color: 'secondary' }}>
              Select format
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                size='xs'
                prefix={<Down sx={{ mt: -1 }} />}
                onClick={() => handleDownload('csv')}
              >
                CSV
              </Button>
              <Button
                size='xs'
                prefix={<Down sx={{ mt: -1 }} />}
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
