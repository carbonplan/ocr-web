import { useEffect } from 'react'
import { useStore } from '@/lib/store'
import { LAYERS } from '@/lib/config'

const Counties = () => {
  const map = useStore((state) => state.map)

  useEffect(() => {
    if (!map) return

    const initializeLayers = () => {
      if (!map.getSource(LAYERS.counties.sourceId)) {
        map.addSource(LAYERS.counties.sourceId, {
          type: 'vector',
          url: `pmtiles://${process.env.NEXT_PUBLIC_COUNTY_URL}`,
        })
      }

      if (!map.getLayer(LAYERS.counties.layerIds.fill)) {
        map.addLayer(
          {
            id: LAYERS.counties.layerIds.fill,
            type: 'fill',
            source: LAYERS.counties.sourceId,
            'source-layer': LAYERS.counties.layerName,
            paint: {
              'fill-opacity': 0.1,
            },
          },
          'background',
        )
      }

      if (!map.getLayer(LAYERS.counties.layerIds.line)) {
        map.addLayer(
          {
            id: LAYERS.counties.layerIds.line,
            type: 'line',
            source: LAYERS.counties.sourceId,
            'source-layer': LAYERS.counties.layerName,
            paint: {
              'line-opacity': 0,
            },
          },
          'background',
        )
      }
    }

    if (map.isStyleLoaded()) {
      initializeLayers()
    } else {
      map.on('load', initializeLayers)
    }

    return () => {
      try {
        if (!map) return

        if (map.getLayer(LAYERS.counties.layerIds.fill)) {
          map.removeLayer(LAYERS.counties.layerIds.fill)
        }
        if (map.getLayer(LAYERS.counties.layerIds.line)) {
          map.removeLayer(LAYERS.counties.layerIds.line)
        }
        if (map.getSource(LAYERS.counties.sourceId)) {
          map.removeSource(LAYERS.counties.sourceId)
        }
      } catch (error) {
        console.error('Error removing counties layers:', error)
      }
    }
  }, [map])

  return null
}

export default Counties
