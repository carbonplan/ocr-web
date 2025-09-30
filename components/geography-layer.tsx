import { useEffect, useMemo } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { calculateBinBoundaries, useColormap } from '@/lib/colormaps'

interface GeographyLayerProps {
  config: {
    layerName: string
    sourceId: string
    layerIds: {
      fill: string
      line: string
    }
  }
  geographyKey: 'county' | 'censusTract'
  environmentUrl: string
}

const GeographyLayer = ({
  config,
  geographyKey,
  environmentUrl,
}: GeographyLayerProps) => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const geographies = useStore((state) => state.geographies)
  const attribute = useStore((state) => state.attribute)
  const timePeriod = useStore((state) => state.timePeriod)
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)

  const riskAttribute = riskConfig.attributes[attribute][timePeriod]
  const avgRiskAttribute = `avg_${riskAttribute}_horizon_1`

  const colormap = useColormap(riskConfig.colormap, {
    format: 'hex',
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap?.length) return ['literal', 'transparent']

    const wrap = (expr: ExpressionSpecification) => [
      'case',
      ['<', ['to-number', ['get', avgRiskAttribute]], riskConfig.bounds.min],
      get(theme, 'rawColors.muted'),
      expr,
    ]

    const makeDiscrete = (): ExpressionSpecification => {
      const steps: (string | number)[] = []

      const stepValues = calculateBinBoundaries(
        colorLimits.bounds,
        riskConfig.binRatios,
      ).slice(1) // remove first value to shift to correct step

      stepValues.forEach((value: number, index: number) => {
        if (index < colormap.length - 1) {
          steps.push(value, colormap[index + 1])
        }
      })

      return [
        'step',
        ['to-number', ['get', avgRiskAttribute]],
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
        ['to-number', ['get', avgRiskAttribute]],
        ...stops,
      ] as ExpressionSpecification
    }

    return wrap(
      colorLimits.type === 'discrete' ? makeDiscrete() : makeContinuous(),
    ) as ExpressionSpecification
  }, [
    colormap,
    avgRiskAttribute,
    colorLimits.type,
    colorLimits.bounds,
    theme,
    riskConfig.binRatios,
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
              'fill-opacity': geographies[geographyKey] ? 1 : 0,
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
              'line-opacity': geographies[geographyKey] ? 1 : 0,
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
        if (map.getSource(config.sourceId)) {
          map.removeSource(config.sourceId)
        }
      } catch (error) {
        console.error(`Error removing ${geographyKey} layers:`, error)
      }
    }
  }, [map])

  useEffect(() => {
    // Update color expression when variable selection changes
    if (!map || !map.getLayer(config.layerIds.fill)) return
    map.setPaintProperty(config.layerIds.fill, 'fill-color', colorExpression)
  }, [map, colorExpression])

  useEffect(() => {
    // Update opacity based on geography selection
    if (!map || !map.getLayer(config.layerIds.fill)) return
    map.setPaintProperty(
      config.layerIds.fill,
      'fill-opacity',
      geographies[geographyKey] ? 1 : 0,
    )
    if (map.getLayer(config.layerIds.line)) {
      map.setPaintProperty(
        config.layerIds.line,
        'line-opacity',
        geographies[geographyKey] ? 1 : 0,
      )
      map.setPaintProperty(
        config.layerIds.line,
        'line-color',
        get(theme, 'rawColors.secondary'),
      )
    }
  }, [map, geographies, geographyKey, theme])

  return null
}

export default GeographyLayer
