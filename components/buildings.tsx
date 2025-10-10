import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, MapMouseEvent } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useBuildingUtils } from '@/hooks/useBuildingUtils'
import { DATA_URLS, LAYERS } from '@/lib/config'
import { useColormap } from '@/lib/colormaps'
import { useBreakpointIndex } from '@theme-ui/match-media'
import { getBuildingRiskKey } from '@/lib/risk-utils'
import { Building } from '@/types/location'

const Buildings = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const selectedBuilding = useStore((state) => state.selectedBuilding) // todo clear state
  const setSelectedBuilding = useStore((state) => state.setSelectedBuilding)
  const setHoveredBuilding = useStore((state) => state.setHoveredBuilding)
  const setSelectedCoordinates = useStore(
    (state) => state.setSelectedCoordinates,
  )
  const clearSelections = useStore((state) => state.clearSelections)
  const timePeriod = useStore((state) => state.timePeriod)
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)
  const sidebarWidth = useStore((state) => state.sidebarWidth)
  const setShowAddressDetails = useStore((state) => state.setShowAddressDetails)
  const { queryGeographiesAtPoint } = useBuildingUtils()
  const riskAttribute = getBuildingRiskKey(timePeriod)
  const isUserClick = useRef(false)
  const hoveredFeatureId = useRef<string | number | null>(null)
  const index = useBreakpointIndex({ defaultIndex: 2 })
  const indexRef = useRef(index)
  const sidebarWidthRef = useRef(sidebarWidth)

  // refs prevent stale state in event listeners
  useEffect(() => {
    indexRef.current = index
  }, [index])
  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth
  }, [sidebarWidth])

  const colormap = useColormap(riskConfig.colormap, {
    count:
      colorLimits.type === 'discrete' ? colorLimits.binBoundaries.length : 256,
  })

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap?.length) return ['literal', 'transparent']

    const riskPercentExpression: ExpressionSpecification = [
      'to-number',
      ['get', riskAttribute],
    ]

    const wrap = (expr: ExpressionSpecification) => [
      'case',
      ['<', riskPercentExpression, riskConfig.bounds.min],
      get(theme, 'rawColors.muted'),
      expr,
    ]

    const makeDiscrete = (): ExpressionSpecification => {
      const steps: (string | number)[] = []

      colorLimits.binBoundaries.forEach((value: number, index: number) => {
        if (index < colormap.length) {
          steps.push(value, colormap[index])
        }
      })

      return [
        'step',
        riskPercentExpression,
        colormap[0],
        ...steps,
      ] as ExpressionSpecification
    }

    const makeContinuous = (): ExpressionSpecification => {
      const stops: (string | number)[] = []
      colormap.forEach((color: string, index: number) => {
        const rawValue =
          colorLimits.bounds[0] +
          (index / (colormap.length - 1)) *
            (colorLimits.bounds[1] - colorLimits.bounds[0])
        stops.push(rawValue, color)
      })

      return [
        'interpolate',
        ['linear'],
        riskPercentExpression,
        ...stops,
      ] as ExpressionSpecification
    }

    return wrap(
      colorLimits.type === 'discrete' ? makeDiscrete() : makeContinuous(),
    ) as ExpressionSpecification
  }, [
    colormap,
    riskAttribute,
    colorLimits.type,
    colorLimits.bounds,
    colorLimits.binBoundaries,
    theme,
    riskConfig.bounds.min,
  ])

  const lineColorExpression: ExpressionSpecification = useMemo(() => {
    return [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      get(theme, 'rawColors.primary'),
      ['boolean', ['feature-state', 'hovered'], false],
      get(theme, 'rawColors.primary'),
      get(theme, 'rawColors.secondary'),
    ] as ExpressionSpecification
  }, [theme])

  const opacityExpression: ExpressionSpecification = useMemo(() => {
    return [
      'interpolate',
      ['linear'],
      ['zoom'],
      13,
      0,
      13.1,
      1,
    ] as ExpressionSpecification
  }, [])

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
            setHoveredBuilding(feature as Building)
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
          setHoveredBuilding(null)
        }
      }
    },
    [map, setHoveredBuilding],
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

    setHoveredBuilding(null)

    map.getCanvas().style.cursor = ''
  }, [map, setHoveredBuilding])

  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      if (!map) return

      clearSelections()
      setShowAddressDetails(false)

      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (features.length > 0) {
        setSelectedBuilding(features[0] as Building)
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
        setHoveredBuilding(null)

        const feature = features[0]
        const { lng, lat } = e.lngLat
        isUserClick.current = true

        queryGeographiesAtPoint(lng, lat)

        if (feature.id) {
          map.removeFeatureState({
            source: LAYERS.buildings.sourceId,
            sourceLayer: LAYERS.buildings.layerName,
          })

          map.setFeatureState(
            {
              source: LAYERS.buildings.sourceId,
              id: feature.id,
              sourceLayer: LAYERS.buildings.layerName,
            },
            { selected: true },
          )

          const offset: [number, number] =
            indexRef.current < 2
              ? [0, -window.innerHeight / 4]
              : [(sidebarWidthRef.current - 50) / 2, 0]

          map.easeTo({
            center: [lng, lat],
            offset,
          })
          setSelectedCoordinates({ lat, lng })
          setShowAddressDetails(true)
        }
      } else {
        clearSelections()
        setShowAddressDetails(false)
        map.removeFeatureState({
          source: LAYERS.buildings.sourceId,
          sourceLayer: LAYERS.buildings.layerName,
        })
      }
    },
    [
      map,
      setSelectedBuilding,
      setSelectedCoordinates,
      clearSelections,
      setHoveredBuilding,
      queryGeographiesAtPoint,
      setShowAddressDetails,
    ],
  )

  useEffect(() => {
    // remove highlight when building is deselected outside of map context
    if (
      !selectedBuilding &&
      map?.isStyleLoaded() &&
      map.getSource(LAYERS.buildings.sourceId)
    ) {
      map.removeFeatureState({
        source: LAYERS.buildings.sourceId,
        sourceLayer: LAYERS.buildings.layerName,
      })
    }
  }, [selectedBuilding, map])

  useEffect(() => {
    // initialize layers and listeners
    if (!map) return

    const initializeLayers = () => {
      if (!map.getSource(LAYERS.buildings.sourceId)) {
        map.addSource(LAYERS.buildings.sourceId, {
          type: 'vector',
          url: `pmtiles://${DATA_URLS.vector.buildings}`,
        })
      }

      if (!map.getLayer(LAYERS.buildings.layerIds.fill)) {
        map.addLayer(
          {
            id: LAYERS.buildings.layerIds.fill,
            type: 'fill',
            source: LAYERS.buildings.sourceId,
            'source-layer': LAYERS.buildings.layerName,
            paint: {
              'fill-color': colorExpression,
              'fill-opacity': opacityExpression,
            },
          },
          'buildings',
        )
      }

      if (!map.getLayer(LAYERS.buildings.layerIds.line)) {
        map.addLayer(
          {
            id: LAYERS.buildings.layerIds.line,
            type: 'line',
            source: LAYERS.buildings.sourceId,
            'source-layer': LAYERS.buildings.layerName,
            paint: {
              'line-color': lineColorExpression,
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12,
                [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  2,
                  ['boolean', ['feature-state', 'hovered'], false],
                  1,
                  0,
                ],
                14,
                [
                  'case',
                  ['boolean', ['feature-state', 'selected'], false],
                  2,
                  ['boolean', ['feature-state', 'hovered'], false],
                  1,
                  0.3,
                ],
              ],
              'line-opacity': opacityExpression,
            },
          },
          'buildings',
        )
      }
    }

    if (map.isStyleLoaded()) {
      initializeLayers()
    } else {
      map.on('load', initializeLayers)
    }

    map.on('click', handleMapClick)
    map.on('mouseenter', LAYERS.buildings.layerIds.fill, handleBuildingEnter)
    map.on('mousemove', LAYERS.buildings.layerIds.fill, handleBuildingMouseMove)
    map.on('mouseleave', LAYERS.buildings.layerIds.fill, handleBuildingLeave)

    return () => {
      try {
        if (!map) return

        map.off('click', handleMapClick)
        map.off(
          'mouseenter',
          LAYERS.buildings.layerIds.fill,
          handleBuildingEnter,
        )
        map.off(
          'mousemove',
          LAYERS.buildings.layerIds.fill,
          handleBuildingMouseMove,
        )
        map.off(
          'mouseleave',
          LAYERS.buildings.layerIds.fill,
          handleBuildingLeave,
        )

        if (map.getLayer(LAYERS.buildings.layerIds.fill)) {
          map.removeLayer(LAYERS.buildings.layerIds.fill)
        }
        if (map.getLayer(LAYERS.buildings.layerIds.line)) {
          map.removeLayer(LAYERS.buildings.layerIds.line)
        }
        if (map.getSource(LAYERS.buildings.sourceId)) {
          map.removeSource(LAYERS.buildings.sourceId)
        }
      } catch (error) {
        console.error('Error removing buildings layers:', error)
      }
    }
  }, [map])

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

  return null
}

export default Buildings
