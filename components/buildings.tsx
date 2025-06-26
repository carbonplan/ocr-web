import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, LngLat, MapMouseEvent } from 'maplibre-gl'
import { useLocationStore } from '@/store/location'
import { LAYERS } from '@/lib/config'
import { calculateBinBoundaries, useColormap } from '@/lib/colormaps'

const Buildings = () => {
  const { theme } = useThemeUI()
  const map = useLocationStore((state) => state.map)
  const selectedBuilding = useLocationStore((state) => state.selectedBuilding) // todo clear state
  const setSelectedBuilding = useLocationStore(
    (state) => state.setSelectedBuilding,
  )
  const setSelectedLocation = useLocationStore(
    (state) => state.setSelectedLocation,
  )
  const selectedLocation = useLocationStore((state) => state.selectedLocation)
  const wind = useLocationStore((state) => state.wind)
  const sidebarWidth = useLocationStore((state) => state.sidebarWidth)
  const timeHorizon = useLocationStore((state) => state.timeHorizon)
  const timePeriod = useLocationStore((state) => state.timePeriod)
  const colorLimits = useLocationStore((state) => state.colorLimits)
  const riskConfig = useLocationStore((state) => state.riskConfig)

  const riskAttribute = wind
    ? riskConfig.attributes.windRisk[timePeriod]
    : riskConfig.attributes.baseRisk[timePeriod]
  const isUserClick = useRef(false)

  const colormap = useColormap(riskConfig.colormap, {
    format: 'hex',
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  const riskPercentExpression: ExpressionSpecification = useMemo(
    () =>
      timeHorizon === 1
        ? ['*', ['to-number', ['get', riskAttribute]], 100]
        : [
            '*',
            [
              '-',
              1,
              [
                '^',
                ['-', 1, ['to-number', ['get', riskAttribute]]],
                timeHorizon,
              ],
            ],
            100,
          ],
    [timeHorizon, riskAttribute],
  )

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap?.length) return ['literal', 'transparent']

    const wrap = (expr: ExpressionSpecification) => [
      'case',
      ['<=', riskPercentExpression, riskConfig.bounds.min],
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
    riskPercentExpression,
    colorLimits.type,
    colorLimits.bounds,
    theme,
    riskConfig.binRatios,
    riskConfig.bounds.min,
  ])

  const setPointerCursor = useCallback(() => {
    if (map) {
      map.getCanvas().style.cursor = 'pointer'
    }
  }, [map])

  const resetCursor = useCallback(() => {
    if (map) {
      map.getCanvas().style.cursor = ''
    }
  }, [map])

  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      if (!map) return

      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (features.length > 0) {
        setSelectedBuilding(features[0].properties)
        const feature = features[0]
        const { lng, lat } = e.lngLat
        isUserClick.current = true

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
            { highlighted: true },
          )

          try {
            const response = await fetch(
              `/api/geocode/reverse?lat=${lat}&lng=${lng}`,
            )
            if (response.ok) {
              const location = await response.json()
              setSelectedLocation(location)
            }
          } catch (error) {
            console.error('Error fetching location details:', error)
          }
        }
      } else {
        setSelectedBuilding(null)
        setSelectedLocation(null)
        map.removeFeatureState({
          source: LAYERS.buildings.sourceId,
          sourceLayer: LAYERS.buildings.layerName,
        })
      }
    },
    [map, setSelectedBuilding, setSelectedLocation],
  )

  const highlightBuildingAtLocation = useCallback(
    (lng: number, lat: number) => {
      if (
        !map?.getSource(LAYERS.buildings.sourceId) ||
        !map?.getLayer(LAYERS.buildings.layerIds.fill)
      ) {
        return
      }

      map.removeFeatureState({
        source: LAYERS.buildings.sourceId,
        sourceLayer: LAYERS.buildings.layerName,
      })

      const point = map.project([lng, lat])
      const features = map.queryRenderedFeatures(point, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (features.length > 0) {
        const buildingFeature = features[0]
        setSelectedBuilding(buildingFeature.properties)
        if (buildingFeature.id) {
          map.setFeatureState(
            {
              source: LAYERS.buildings.sourceId,
              id: buildingFeature.id,
              sourceLayer: LAYERS.buildings.layerName,
            },
            { highlighted: true },
          )
        }
      }
    },
    [map, setSelectedBuilding],
  )

  useEffect(() => {
    // remove highlight when building is deselected outside of map context
    if (!selectedBuilding && map?.isStyleLoaded()) {
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
          url: `pmtiles://${LAYERS.buildings.dataSource}`,
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
            },
          },
          'background',
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
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'highlighted'], false],
                get(theme, 'rawColors.primary'),
                [
                  'case',
                  ['<=', riskPercentExpression, riskConfig.bounds.min],
                  get(theme, 'rawColors.muted'),
                  colorExpression,
                ],
              ],
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12,
                [
                  'case',
                  ['boolean', ['feature-state', 'highlighted'], false],
                  2,
                  0,
                ],
                14,
                [
                  'case',
                  ['boolean', ['feature-state', 'highlighted'], false],
                  2,
                  1,
                ],
              ],
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
    map.on('click', handleMapClick)
    map.on('mouseenter', LAYERS.buildings.layerIds.fill, setPointerCursor)
    map.on('mouseleave', LAYERS.buildings.layerIds.fill, resetCursor)

    return () => {
      try {
        if (!map) return

        map.off('click', handleMapClick)
        map.off('mouseenter', LAYERS.buildings.layerIds.fill, setPointerCursor)
        map.off('mouseleave', LAYERS.buildings.layerIds.fill, resetCursor)

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
    // fly to selected location and highlight building
    if (!map || !selectedLocation || !map.isStyleLoaded()) return

    if (!isUserClick.current) {
      const addressLocation = new LngLat(
        selectedLocation.position.lng,
        selectedLocation.position.lat,
      )
      map.flyTo({
        center: addressLocation,
        zoom: selectedLocation.address.houseNumber ? 17 : 12,
        offset: [sidebarWidth / 2, 0], // Dynamic offset based on actual sidebar width
      })

      const handleMoveEnd = () => {
        highlightBuildingAtLocation(
          selectedLocation.position.lng,
          selectedLocation.position.lat,
        )
      }

      map.once('moveend', handleMoveEnd)
      return () => {
        if (map) {
          map.off('moveend', handleMoveEnd)
        }
      }
    }

    isUserClick.current = false
  }, [selectedLocation, highlightBuildingAtLocation, map, sidebarWidth])

  useEffect(() => {
    // update color expression when variable selection changes
    if (!map || !map.isStyleLoaded()) return
    map.setPaintProperty(
      LAYERS.buildings.layerIds.fill,
      'fill-color',
      colorExpression,
    )

    const lineColorExpression: ExpressionSpecification = [
      'case',
      ['boolean', ['feature-state', 'highlighted'], false],
      get(theme, 'rawColors.primary'),
      [
        'case',
        ['<=', riskPercentExpression, riskConfig.bounds.min],
        get(theme, 'rawColors.muted'),
        colorExpression,
      ],
    ]

    map.setPaintProperty(
      LAYERS.buildings.layerIds.line,
      'line-color',
      lineColorExpression,
    )
  }, [
    map,
    colorExpression,
    riskPercentExpression,
    theme,
    riskConfig.bounds.min,
  ])

  return null
}

export default Buildings
