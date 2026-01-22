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
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution:
          '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank">Mapzen</a>',
        maxzoom: 15,
        minzoom: 6,
        encoding: 'terrarium',
      })
    }

    if (!map.getLayer(layerId)) {
      map.addLayer(
        {
          id: layerId,
          type: 'hillshade',
          source: sourceId,
          paint: {
            'hillshade-exaggeration': 0.08,
          },
        },
        'landcover',
      )
    }
  }, [map])

  return null
}

export default HillshadeLayer
