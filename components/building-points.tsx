import { useEffect, useMemo } from 'react'
import { ExpressionSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { LAYERS } from '@/lib/config'
import { useColormap } from '@/lib/colormaps'

const BuildingPoints = () => {
  const map = useStore((state) => state.map)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormap()

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap?.length) return ['literal', 'transparent']
    const scoreExpression: ExpressionSpecification = ['to-number', ['get', '0']]
    const steps: (string | number)[] = []
    colorLimits.binBoundaries.forEach((value: number, index: number) => {
      if (index < colormap.length) {
        steps.push(value, colormap[index])
      }
    })
    return [
      'step',
      scoreExpression,
      colormap[0],
      ...steps,
    ] as ExpressionSpecification
  }, [colormap, colorLimits.binBoundaries])

  useEffect(() => {
    if (!map) return

    const initializeLayer = () => {
      if (!map.getSource(LAYERS.buildingPoints.sourceId)) {
        return
      }

      if (!map.isSourceLoaded(LAYERS.buildingPoints.sourceId)) {
        return
      }

      if (!map.getLayer(LAYERS.buildings.layerIds.fill)) {
        return
      }

      if (!map.getLayer(LAYERS.buildingPoints.layerIds.circle)) {
        map.addLayer(
          {
            id: LAYERS.buildingPoints.layerIds.circle,
            type: 'circle',
            source: LAYERS.buildingPoints.sourceId,
            'source-layer': LAYERS.buildingPoints.layerName,
            paint: {
              'circle-color': colorExpression,
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8,
                1,
                14,
                2,
              ],
              'circle-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                14,
                1,
                14.5,
                0,
              ],
              'circle-blur': [
                'interpolate',
                ['linear'],
                ['zoom'],
                11,
                1.5,
                14,
                0,
              ],
            },
          },
          LAYERS.buildings.layerIds.fill,
        )
      }
    }

    if (map.isStyleLoaded()) {
      initializeLayer()
    } else {
      map.once('load', initializeLayer)
    }

    return () => {
      try {
        if (!map) return

        if (map.getLayer(LAYERS.buildingPoints.layerIds.circle)) {
          map.removeLayer(LAYERS.buildingPoints.layerIds.circle)
        }
      } catch (error) {
        console.error('Error removing building points layer:', error)
      }
    }
  }, [map])

  useEffect(() => {
    if (!map || !map.getLayer(LAYERS.buildingPoints.layerIds.circle)) return
    map.setPaintProperty(
      LAYERS.buildingPoints.layerIds.circle,
      'circle-color',
      colorExpression,
    )
  }, [map, colorExpression])

  return null
}

export default BuildingPoints
