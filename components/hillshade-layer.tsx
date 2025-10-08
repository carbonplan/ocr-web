import { useEffect } from 'react'
import { useStore } from '../lib/store'

const HillshadeLayer = () => {
  const map = useStore((state) => state.map)

  useEffect(() => {
    if (!map) return

    const sourceId = 'hillshadeSource'
    const layerId = 'hillshade'

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'raster-dem',
        tiles: [`/api/map/tiles/{z}/{x}/{y}?style=dem`],
        tileSize: 512,
        attribution: `&copy; ${new Date().getFullYear()} HERE Technologies`,
        maxzoom: 14,
      })
    }

    if (!map.getLayer(layerId)) {
      const firstLayerId = map.getStyle().layers?.[0]?.id
      map.addLayer(
        {
          id: layerId,
          type: 'hillshade',
          source: sourceId,
          paint: {
            'hillshade-exaggeration': 0.08,
          },
        },
        firstLayerId,
      )
    }
  }, [map])

  return null
}

export default HillshadeLayer
