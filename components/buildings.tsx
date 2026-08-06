import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, MapMouseEvent } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useBuildingUtils } from '@/hooks/useBuildingUtils'
import { LAYERS } from '@/lib/config'
import { useColormap } from '@/lib/colormaps'
import { getBuildingRiskKey } from '@/lib/risk-utils'
import { Building } from '@/types/location'

const Buildings = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const clearSelections = useStore((state) => state.clearSelections)
  const timePeriod = useStore((state) => state.timePeriod)
  const colorLimits = useStore((state) => state.colorLimits)
  const buildingsMode = useStore((state) => state.riskConfig.buildingsMode)
  const { selectBuilding, selectArea } = useBuildingUtils()
  const riskAttribute = getBuildingRiskKey(timePeriod)
  const hoveredFeatureId = useRef<string | number | null>(null)
  const colormap = useColormap()

  const colorExpression: ExpressionSpecification = useMemo(() => {
    // query-mode hazards have no per-building attributes in the tiles;
    // buildings stay transparent (but clickable) over the raster
    if (buildingsMode === 'query') return ['literal', 'transparent']
    if (!colormap?.length) return ['literal', 'transparent']

    const riskPercentExpression: ExpressionSpecification = [
      'to-number',
      ['get', riskAttribute],
    ]
    const wrap = (expr: ExpressionSpecification) => [
      'case',
      ['==', riskPercentExpression, 0],
      colormap[0],
      expr,
    ]

    const makeDiscrete = (): ExpressionSpecification => {
      const steps: (string | number)[] = []

      colorLimits.binBoundaries.forEach((value: number, index: number) => {
        if (index + 1 < colormap.length) {
          steps.push(value, colormap[index + 1])
        }
      })

      return [
        'step',
        riskPercentExpression,
        colormap[0],
        ...steps,
      ] as ExpressionSpecification
    }

    return wrap(makeDiscrete()) as ExpressionSpecification
  }, [colormap, riskAttribute, colorLimits.binBoundaries, buildingsMode])

  const lineColorExpression: ExpressionSpecification = useMemo(() => {
    return [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      get(theme, 'rawColors.primary'),
      ['boolean', ['feature-state', 'hovered'], false],
      get(theme, 'rawColors.primary'),
      // over the raster (query mode) outlines need to read against the bin
      // colors, so use background to match the basemap linework; secondary
      // is too subtle there but right for attribute-colored fills
      buildingsMode === 'query'
        ? get(theme, 'rawColors.background')
        : get(theme, 'rawColors.secondary'),
    ] as ExpressionSpecification
  }, [theme, buildingsMode])

  const lineWidthExpression: ExpressionSpecification = useMemo(() => {
    const width = (selected: number, hovered: number, base: number) =>
      [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        selected,
        ['boolean', ['feature-state', 'hovered'], false],
        hovered,
        base,
      ] as ExpressionSpecification
    // query-mode hazards render transparent fills, so the outline is the
    // only visible building affordance and needs real weight at high zoom
    if (buildingsMode === 'query') {
      return [
        'interpolate',
        ['linear'],
        ['zoom'],
        12,
        width(2, 1, 0),
        14,
        width(2, 1, 0.5),
        17,
        width(2.5, 1.5, 1),
      ] as ExpressionSpecification
    }
    return [
      'interpolate',
      ['linear'],
      ['zoom'],
      12,
      width(2, 1, 0),
      14,
      width(2, 1, 0.3),
    ] as ExpressionSpecification
  }, [buildingsMode])

  const handleBuildingMouseMove = useCallback(
    (e: MapMouseEvent) => {
      if (!map || map.getZoom() <= 13) return

      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (features.length > 0) {
        const feature = features[0]

        if (feature.id !== hoveredFeatureId.current) {
          if (hoveredFeatureId.current !== null) {
            map.setFeatureState(
              {
                source: LAYERS.buildings.sourceId,
                id: hoveredFeatureId.current,
                sourceLayer: LAYERS.buildings.layerName,
              },
              { hovered: false },
            )
          }

          if (feature.id && feature.properties) {
            hoveredFeatureId.current = feature.id

            map.setFeatureState(
              {
                source: LAYERS.buildings.sourceId,
                id: feature.id,
                sourceLayer: LAYERS.buildings.layerName,
              },
              { hovered: true },
            )
          }
        }
      } else {
        if (hoveredFeatureId.current !== null) {
          map.setFeatureState(
            {
              source: LAYERS.buildings.sourceId,
              id: hoveredFeatureId.current,
              sourceLayer: LAYERS.buildings.layerName,
            },
            { hovered: false },
          )
          hoveredFeatureId.current = null
        }
      }
    },
    [map],
  )

  const handleBuildingEnter = useCallback(() => {
    if (map) {
      map.getCanvas().style.cursor = 'pointer'
    }
  }, [map])

  const handleBuildingLeave = useCallback(() => {
    if (!map) return

    if (hoveredFeatureId.current !== null) {
      map.setFeatureState(
        {
          source: LAYERS.buildings.sourceId,
          id: hoveredFeatureId.current,
          sourceLayer: LAYERS.buildings.layerName,
        },
        { hovered: false },
      )
      hoveredFeatureId.current = null
    }

    map.getCanvas().style.cursor = ''
  }, [map])

  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      if (!map) return

      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (features.length > 0) {
        if (hoveredFeatureId.current !== null) {
          map.setFeatureState(
            {
              source: LAYERS.buildings.sourceId,
              id: hoveredFeatureId.current,
              sourceLayer: LAYERS.buildings.layerName,
            },
            { hovered: false },
          )
          hoveredFeatureId.current = null
        }

        const feature = features[0]
        selectBuilding(feature as unknown as Building)
      } else if (buildingsMode === 'query') {
        // the raster is coarse enough that any point is meaningful, so a
        // bare-map click selects the area under the cursor
        selectArea(e.lngLat.lng, e.lngLat.lat)
      } else {
        clearSelections()
      }
    },
    [map, selectBuilding, selectArea, clearSelections, buildingsMode],
  )

  useEffect(() => {
    if (!map) return

    map.on('click', handleMapClick)
    map.on('mouseenter', LAYERS.buildings.layerIds.fill, handleBuildingEnter)
    map.on('mousemove', LAYERS.buildings.layerIds.fill, handleBuildingMouseMove)
    map.on('mouseleave', LAYERS.buildings.layerIds.fill, handleBuildingLeave)

    return () => {
      if (!map) return
      map.off('click', handleMapClick)
      map.off('mouseenter', LAYERS.buildings.layerIds.fill, handleBuildingEnter)
      map.off(
        'mousemove',
        LAYERS.buildings.layerIds.fill,
        handleBuildingMouseMove,
      )
      map.off('mouseleave', LAYERS.buildings.layerIds.fill, handleBuildingLeave)
    }
  }, [
    map,
    handleMapClick,
    handleBuildingEnter,
    handleBuildingMouseMove,
    handleBuildingLeave,
  ])

  useEffect(() => {
    // update color expression when variable selection changes
    if (!map || !map.getLayer(LAYERS.buildings.layerIds.fill)) return
    map.setPaintProperty(
      LAYERS.buildings.layerIds.fill,
      'fill-color',
      colorExpression,
    )
  }, [map, colorExpression])

  useEffect(() => {
    // update line highlight color when theme changes
    if (!map || !map.getLayer(LAYERS.buildings.layerIds.line)) return
    map.setPaintProperty(
      LAYERS.buildings.layerIds.line,
      'line-color',
      lineColorExpression,
    )
  }, [map, lineColorExpression])

  useEffect(() => {
    if (!map || !map.getLayer(LAYERS.buildings.layerIds.line)) return
    map.setPaintProperty(
      LAYERS.buildings.layerIds.line,
      'line-width',
      lineWidthExpression,
    )
  }, [map, lineWidthExpression])

  return null
}

export default Buildings
