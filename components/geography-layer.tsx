import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, MapMouseEvent } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { getGeographyMedianRiskKey } from '@/lib/risk-utils'
import { GeographyKey, Geography } from '@/types/location'
import { GEOGRAPHY_ATTRIBUTE_KEYS, LAYERS } from '@/lib/config'

interface GeographyLayerProps {
  config: {
    layerName: string
    sourceId: string
    layerIds: {
      fill: string
      line: string
    }
  }
  geographyKey: GeographyKey
}

const GeographyLayer = ({ config, geographyKey }: GeographyLayerProps) => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const geographyLayerVisibility = useStore(
    (state) => state.geographyLayerVisibility,
  )
  const timePeriod = useStore((state) => state.timePeriod)
  const colorLimits = useStore((state) => state.colorLimits)
  const selectedGeographyLevel = useStore(
    (state) => state.selectedGeographyLevel,
  )
  const showGeographyHighlight = useStore(
    (state) => state.showGeographyHighlight,
  )
  const hasManualGeoSelection = useStore((state) => state.hasManualGeoSelection)
  const activeGeographies = useStore((state) => state.activeGeographies)
  const setActiveGeographies = useStore((state) => state.setActiveGeographies)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const previousGeoidRef = useRef<string | null>(null)
  const hoveredFeatureRef = useRef<string | null>(null)

  const colormap = useColormap()

  const highlightLayerId = `${config.layerIds.line}-highlight`
  const hoverLayerId = `${config.layerIds.line}-hover`
  const glowLayerId = `${config.layerIds.line}-glow`
  const medianRisk = getGeographyMedianRiskKey(timePeriod)

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap?.length) return ['literal', 'transparent']

    const wrap = (expr: ExpressionSpecification) => [
      'case',
      ['==', ['to-number', ['get', medianRisk]], 0],
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
        ['to-number', ['get', medianRisk]],
        colormap[0],
        ...steps,
      ] as ExpressionSpecification
    }

    return wrap(makeDiscrete()) as ExpressionSpecification
  }, [colormap, medianRisk, colorLimits.binBoundaries, theme])

  useEffect(() => {
    if (!map || !map.getLayer(config.layerIds.fill)) return

    const isSelectedLevel = selectedGeographyLevel === geographyKey
    const showManualOutlines = hasManualGeoSelection && isSelectedLevel
    const showLayerOutlines = geographyLayerVisibility[geographyKey]

    map.setPaintProperty(config.layerIds.fill, 'fill-color', colorExpression)
    map.setPaintProperty(
      config.layerIds.fill,
      'fill-opacity',
      showLayerOutlines ? 1 : 0,
    )
    map.setPaintProperty(
      config.layerIds.line,
      'line-opacity',
      showLayerOutlines || showManualOutlines ? 1 : 0,
    )
    map.setPaintProperty(
      config.layerIds.line,
      'line-color',
      showManualOutlines && !showLayerOutlines
        ? get(theme, 'rawColors.hinted')
        : get(theme, 'rawColors.secondary'),
    )
    map.setPaintProperty(
      highlightLayerId,
      'line-color',
      get(theme, 'rawColors.primary'),
    )
    map.setPaintProperty(
      hoverLayerId,
      'line-color',
      get(theme, 'rawColors.secondary'),
    )
    map.setPaintProperty(glowLayerId, 'line-color', get(theme, 'rawColors.primary'))
  }, [
    map,
    colorExpression,
    geographyLayerVisibility,
    geographyKey,
    theme,
    config.layerIds.fill,
    config.layerIds.line,
    highlightLayerId,
    hoverLayerId,
    glowLayerId,
    hasManualGeoSelection,
    selectedGeographyLevel,
  ])

  useEffect(() => {
    if (!map || !map.getSource(config.sourceId)) return

    const isSelected = selectedGeographyLevel === geographyKey
    const activeGeography = activeGeographies[geographyKey]
    const geoid = activeGeography?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]

    if (previousGeoidRef.current) {
      map.removeFeatureState(
        {
          source: config.sourceId,
          sourceLayer: config.layerName,
          id: previousGeoidRef.current,
        },
        'selected',
      )
    }

    if (isSelected && geoid && (showGeographyHighlight || hasManualGeoSelection)) {
      map.setFeatureState(
        {
          source: config.sourceId,
          sourceLayer: config.layerName,
          id: geoid,
        },
        { selected: true },
      )
      previousGeoidRef.current = geoid
    } else {
      previousGeoidRef.current = null
    }
  }, [
    map,
    selectedGeographyLevel,
    activeGeographies,
    geographyKey,
    config.sourceId,
    config.layerName,
    showGeographyHighlight,
    hasManualGeoSelection,
  ])

  // Interaction handlers - only active for the selected geography level
  const isSelectedLevel = selectedGeographyLevel === geographyKey

  const clearHoveredFeature = useCallback(() => {
    if (!map || !hoveredFeatureRef.current) return
    map.setFeatureState(
      {
        source: config.sourceId,
        sourceLayer: config.layerName,
        id: hoveredFeatureRef.current,
      },
      { hovered: false },
    )
    hoveredFeatureRef.current = null
  }, [map, config.sourceId, config.layerName])

  const handleMouseMove = useCallback(
    (e: MapMouseEvent) => {
      if (!map) return

      // Check if hovering over a building - let building hover take precedence
      const buildingFeatures = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (buildingFeatures.length > 0) {
        clearHoveredFeature()
        return
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: [config.layerIds.fill],
      })

      if (features.length > 0) {
        const feature = features[0]
        const featureId = feature.properties?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]

        if (featureId && hoveredFeatureRef.current !== featureId) {
          clearHoveredFeature()
          hoveredFeatureRef.current = featureId
          map.setFeatureState(
            {
              source: config.sourceId,
              sourceLayer: config.layerName,
              id: featureId,
            },
            { hovered: true },
          )
        }
        map.getCanvas().style.cursor = 'pointer'
      } else {
        clearHoveredFeature()
        map.getCanvas().style.cursor = ''
      }
    },
    [map, config, clearHoveredFeature],
  )

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      if (!map) return

      // Check if clicking on a building - buildings take priority
      const buildingFeatures = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (buildingFeatures.length > 0) return

      const features = map.queryRenderedFeatures(e.point, {
        layers: [config.layerIds.fill],
      })

      if (features.length > 0) {
        const geography = features[0].properties as Geography
        setActiveGeographies({
          ...activeGeographies,
          [geographyKey]: geography,
        } as typeof activeGeographies)
      }
    },
    [map, config.layerIds.fill, activeGeographies, setActiveGeographies, geographyKey],
  )

  const handleMouseLeave = useCallback(() => {
    clearHoveredFeature()
    if (map) {
      map.getCanvas().style.cursor = ''
    }
  }, [map, clearHoveredFeature])

  useEffect(() => {
    if (!map || !isSelectedLevel || !hasManualGeoSelection || selectedBuilding) return

    const canvas = map.getCanvas()
    map.on('mousemove', handleMouseMove)
    map.on('click', handleClick)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      map.off('mousemove', handleMouseMove)
      map.off('click', handleClick)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      clearHoveredFeature()
      map.getCanvas().style.cursor = ''
    }
  }, [
    map,
    isSelectedLevel,
    hasManualGeoSelection,
    selectedBuilding,
    handleMouseMove,
    handleClick,
    handleMouseLeave,
    clearHoveredFeature,
  ])

  return null
}

export default GeographyLayer
