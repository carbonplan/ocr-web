import { useCallback } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Right } from '@carbonplan/icons'
import { LAYERS } from '@/lib/config'

const DownloadBuildings = () => {
  const map = useStore((state) => state.map)
  const mapZoom = useStore((state) => state.map?.getZoom())

  const downloadBuildingsAsGeoJSON = useCallback(() => {
    if (!map) return

    try {
      const features = map.queryRenderedFeatures({
        layers: [LAYERS.buildings.layerIds.fill],
      })

      const geojson = {
        type: 'FeatureCollection' as const,
        features: features.map((feature) => ({
          type: 'Feature' as const,
          properties: feature.properties,
          geometry: feature.geometry,
        })),
      }
      const blob = new Blob([JSON.stringify(geojson, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `building-fire-risk-${new Date().toISOString().split('T')[0]}.geojson`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading buildings:', error)
    }
  }, [map])

  if (!mapZoom || mapZoom < 13) {
    return null
  }

  return (
    <Button
      onClick={downloadBuildingsAsGeoJSON}
      inverted
      size='xs'
      title='Download Visible Buildings (GeoJSON)'
      sx={{
        width: '100%',
        '&:hover': {
          svg: {
            transform: 'rotate(135deg)',
          },
        },
      }}
      suffix={
        <Right
          sx={{
            transform: 'rotate(90deg)',
          }}
        />
      }
    >
      Download visible buildings
    </Button>
  )
}

export default DownloadBuildings
