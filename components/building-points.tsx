import { useCallback, useEffect, useMemo } from 'react'
import { ExpressionSpecification, MapMouseEvent } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { LAYERS } from '@/lib/config'
import { ensureSourceLoaded } from '@/lib/map-utils'
import { useColormap } from '@/lib/colormaps'
import { getBuildingRiskKey } from '@/lib/risk-utils'
import { useBuildingUtils } from '@/hooks/useBuildingUtils'

const ZOOM_THRESHOLD = 12

const BuildingPoints = () => {
  const map = useStore((state) => state.map)
  const colorLimits = useStore((state) => state.colorLimits)
  const timePeriod = useStore((state) => state.timePeriod)
  const colormap = useColormap()
  const riskAttribute = getBuildingRiskKey(timePeriod)
  const { highlightBuildingAtLocation } = useBuildingUtils()

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap?.length) return ['literal', 'transparent']
    const scoreExpression: ExpressionSpecification = [
      'to-number',
      ['get', riskAttribute],
    ]
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
  }, [colormap, colorLimits.binBoundaries, riskAttribute])

  const handlePointEnter = useCallback(() => {
    if (map && map.getZoom() > ZOOM_THRESHOLD) {
      map.getCanvas().style.cursor = 'pointer'
    }
  }, [map])

  const handlePointLeave = useCallback(() => {
    if (map) {
      map.getCanvas().style.cursor = ''
    }
  }, [map])

  const handlePointClick = useCallback(
    async (e: MapMouseEvent) => {
      if (!map || map.getZoom() < ZOOM_THRESHOLD) return

      // Check if a building was also clicked - if so, prefer building click and skip point click
      const buildingFeatures = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })
      if (buildingFeatures.length > 0) return

      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildingPoints.layerIds.circle],
      })

      if (features.length > 0) {
        const feature = features[0]
        if (feature.geometry.type !== 'Point') return
        const [lng, lat] = feature.geometry.coordinates

        const handleMoveEnd = async () => {
          await ensureSourceLoaded(map, LAYERS.buildings.sourceId)
          highlightBuildingAtLocation(lng, lat, { easeTo: false })
        }

        map.once('moveend', handleMoveEnd)

        map.easeTo({
          center: [lng, lat],
          zoom: 15,
        })
      }
    },
    [map, highlightBuildingAtLocation],
  )

  useEffect(() => {
    if (!map) return

    map.on('click', LAYERS.buildingPoints.layerIds.circle, handlePointClick)
    map.on(
      'mouseenter',
      LAYERS.buildingPoints.layerIds.circle,
      handlePointEnter,
    )
    map.on(
      'mouseleave',
      LAYERS.buildingPoints.layerIds.circle,
      handlePointLeave,
    )

    return () => {
      if (!map) return
      map.off('click', LAYERS.buildingPoints.layerIds.circle, handlePointClick)
      map.off(
        'mouseenter',
        LAYERS.buildingPoints.layerIds.circle,
        handlePointEnter,
      )
      map.off(
        'mouseleave',
        LAYERS.buildingPoints.layerIds.circle,
        handlePointLeave,
      )
    }
  }, [map, handlePointClick, handlePointEnter, handlePointLeave])

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
