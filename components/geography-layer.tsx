import { useEffect, useMemo } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { getGeographyMedianRiskKey } from '@/lib/risk-utils'
import { GeographyKey } from '@/types/location'
import { GEOGRAPHY_ATTRIBUTE_KEYS } from '@/lib/config'

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
  environmentUrl: string
}

const GeographyLayer = ({
  config,
  geographyKey,
  environmentUrl,
}: GeographyLayerProps) => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const layerVisibility = useStore((state) => state.layerVisibility)
  const timePeriod = useStore((state) => state.timePeriod)
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)
  const selectedGeographyLevel = useStore(
    (state) => state.selectedGeographyLevel,
  )
  const activeGeographies = useStore((state) => state.activeGeographies)
  const colormap = useColormap({ format: 'hex' })

  const highlightLayerId = `${config.layerIds.line}-highlight`

  const medianRisk = getGeographyMedianRiskKey(timePeriod)

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap?.length) return ['literal', 'transparent']

    const wrap = (expr: ExpressionSpecification) => [
      'case',
      ['<', ['to-number', ['get', medianRisk]], riskConfig.bounds.min],
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
        ['to-number', ['get', medianRisk]],
        ...stops,
      ] as ExpressionSpecification
    }

    return wrap(
      colorLimits.type === 'discrete' ? makeDiscrete() : makeContinuous(),
    ) as ExpressionSpecification
  }, [
    colormap,
    medianRisk,
    colorLimits.type,
    colorLimits.bounds,
    colorLimits.binBoundaries,
    theme,
    riskConfig.bounds.min,
  ])

  useEffect(() => {
    if (!map) return

    const initializeLayers = () => {
      if (!map.getSource(config.sourceId)) {
        map.addSource(config.sourceId, {
          type: 'vector',
          url: `pmtiles://${environmentUrl}`,
        })
      }

      if (!map.getLayer(config.layerIds.fill)) {
        map.addLayer(
          {
            id: config.layerIds.fill,
            type: 'fill',
            source: config.sourceId,
            'source-layer': config.layerName,
            paint: {
              'fill-color': colorExpression,
              'fill-opacity': layerVisibility[geographyKey] ? 1 : 0,
            },
          },
          'landcover',
        )
      }

      if (!map.getLayer(config.layerIds.line)) {
        map.addLayer(
          {
            id: config.layerIds.line,
            type: 'line',
            source: config.sourceId,
            'source-layer': config.layerName,
            paint: {
              'line-opacity': layerVisibility[geographyKey] ? 1 : 0,
              'line-color': get(theme, 'rawColors.secondary'),
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                2,
                0.1,
                14,
                0.5,
              ],
            },
          },
          'address_label',
        )
      }

      // Add highlight layer for selected geography
      if (!map.getLayer(highlightLayerId)) {
        map.addLayer(
          {
            id: highlightLayerId,
            type: 'line',
            source: config.sourceId,
            'source-layer': config.layerName,
            paint: {
              'line-opacity': 0,
              'line-color': get(theme, 'rawColors.primary'),
              'line-width': 1,
            },
            filter: ['==', ['get', GEOGRAPHY_ATTRIBUTE_KEYS.geoid], ''],
          },
          'address_label',
        )
      }
    }

    if (map.isStyleLoaded()) {
      initializeLayers()
    } else {
      map.once('load', initializeLayers)
    }

    return () => {
      try {
        if (!map) return

        if (map.getLayer(config.layerIds.fill)) {
          map.removeLayer(config.layerIds.fill)
        }
        if (map.getLayer(config.layerIds.line)) {
          map.removeLayer(config.layerIds.line)
        }
        if (map.getLayer(highlightLayerId)) {
          map.removeLayer(highlightLayerId)
        }
        if (map.getSource(config.sourceId)) {
          map.removeSource(config.sourceId)
        }
      } catch (error) {
        console.error(`Error removing ${geographyKey} layers:`, error)
      }
    }
  }, [map, highlightLayerId])

  useEffect(() => {
    // Update color expression when variable selection changes
    if (!map || !map.getLayer(config.layerIds.fill)) return
    map.setPaintProperty(config.layerIds.fill, 'fill-color', colorExpression)
  }, [map, colorExpression, config.layerIds.fill])

  useEffect(() => {
    // Update opacity based on geography selection
    if (!map || !map.getLayer(config.layerIds.fill)) return
    map.setPaintProperty(
      config.layerIds.fill,
      'fill-opacity',
      layerVisibility[geographyKey] ? 1 : 0,
    )
    if (map.getLayer(config.layerIds.line)) {
      map.setPaintProperty(
        config.layerIds.line,
        'line-opacity',
        layerVisibility[geographyKey] ? 1 : 0,
      )
      map.setPaintProperty(
        config.layerIds.line,
        'line-color',
        get(theme, 'rawColors.secondary'),
      )
    }
  }, [
    map,
    layerVisibility,
    geographyKey,
    theme,
    config.layerIds.fill,
    config.layerIds.line,
  ])

  useEffect(() => {
    // Update highlight layer based on selected geography
    if (!map || !map.getLayer(highlightLayerId)) return

    const isSelected = selectedGeographyLevel === geographyKey
    const activeGeography = activeGeographies[geographyKey]
    const geoid = activeGeography?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]

    if (isSelected && geoid) {
      map.setFilter(highlightLayerId, [
        '==',
        ['get', GEOGRAPHY_ATTRIBUTE_KEYS.geoid],
        geoid,
      ])
      map.setPaintProperty(highlightLayerId, 'line-opacity', 1)
    } else {
      map.setPaintProperty(highlightLayerId, 'line-opacity', 0)
    }
  }, [
    map,
    selectedGeographyLevel,
    activeGeographies,
    geographyKey,
    highlightLayerId,
  ])

  return null
}

export default GeographyLayer
