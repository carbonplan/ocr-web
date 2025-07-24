import { useEffect, useMemo } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { LAYERS } from '@/lib/config'
import { calculateBinBoundaries, useColormap } from '@/lib/colormaps'

const Counties = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const geographies = useStore((state) => state.geographies)
  const attribute = useStore((state) => state.attribute)
  const timeHorizon = useStore((state) => state.timeHorizon)
  const timePeriod = useStore((state) => state.timePeriod)
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)

  const riskAttribute = riskConfig.attributes[attribute][timePeriod]
  const avgRiskAttribute = `avg_${riskAttribute}_horizon_${timeHorizon}`

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
              'fill-color': colorExpression,
              'fill-opacity': geographies.county ? 1 : 0,
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
              'line-opacity': geographies.county ? 0.8 : 0,
              'line-color': get(theme, 'rawColors.muted'),
              'line-width': 1,
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

  useEffect(() => {
    // Update color expression when variable selection changes
    if (!map || !map.getLayer(LAYERS.counties.layerIds.fill)) return
    map.setPaintProperty(
      LAYERS.counties.layerIds.fill,
      'fill-color',
      colorExpression,
    )
  }, [map, colorExpression])

  useEffect(() => {
    // Update opacity based on viewMode
    if (!map || !map.getLayer(LAYERS.counties.layerIds.fill)) return
    map.setPaintProperty(
      LAYERS.counties.layerIds.fill,
      'fill-opacity',
      geographies.county ? 1 : 0,
    )
    if (map.getLayer(LAYERS.counties.layerIds.line)) {
      map.setPaintProperty(
        LAYERS.counties.layerIds.line,
        'line-opacity',
        geographies.county ? 0.8 : 0,
      )
    }
  }, [map, geographies.county])

  return null
}

export default Counties
