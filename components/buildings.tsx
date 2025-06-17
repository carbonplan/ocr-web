import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, LngLat, MapMouseEvent } from 'maplibre-gl'
import { useLocationStore } from '@/store/location'
//@ts-expect-error - carbonplan components types not available
import { useThemedColormap } from '@carbonplan/colormaps'
import { LAYERS, RISKS } from '@/lib/config'

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
  const currentColorLimits = useLocationStore(
    (state) => state.currentColorLimits,
  )

  const isUserClick = useRef(false)

  const colormap = useThemedColormap(RISKS.fire.colormap, {
    format: 'hex',
    count: currentColorLimits.type === 'discrete' ? 5 : 256,
  })

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap || colormap.length === 0) {
      return ['literal', 'transparent']
    }

    const riskAttribute = wind
      ? RISKS.fire.attributes.windRisk
      : RISKS.fire.attributes.baseRisk

    // convert to percentage and calculate horizon risk
    const riskPercentExpression =
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
          ]

    if (currentColorLimits.type === 'discrete') {
      const steps: (string | number)[] = []

      colormap.forEach((color: string, index: number) => {
        if (index < colormap.length - 1) {
          const rawValue =
            currentColorLimits.bounds[0] +
            ((index + 1) / colormap.length) *
              (currentColorLimits.bounds[1] - currentColorLimits.bounds[0])
          steps.push(rawValue, color)
        }
      })

      return [
        'step',
        riskPercentExpression,
        colormap[0],
        ...steps,
      ] as ExpressionSpecification
    } else {
      const stops: (string | number)[] = []
      colormap.forEach((color: string, index: number) => {
        const rawValue =
          currentColorLimits.bounds[0] +
          (index / (colormap.length - 1)) *
            (currentColorLimits.bounds[1] - currentColorLimits.bounds[0])
        stops.push(rawValue, color)
      })

      return [
        'interpolate',
        ['linear'],
        riskPercentExpression,
        ...stops,
      ] as ExpressionSpecification
    }
  }, [
    colormap,
    wind,
    timeHorizon,
    currentColorLimits.type,
    currentColorLimits.bounds,
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

    map.on('load', () => {
      map.addSource(LAYERS.buildings.sourceId, {
        type: 'vector',
        url: `pmtiles://${LAYERS.buildings.dataSource}`,
      })
      map.addLayer(
        {
          id: LAYERS.buildings.layerIds.fill,
          type: 'fill',
          source: LAYERS.buildings.sourceId,
          'source-layer': LAYERS.buildings.layerName,
          paint: {
            'fill-color': colorExpression,
            // 'fill-opacity': 0.5,
          },
        },
        'background',
      )
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
                [
                  '>',
                  [
                    'to-number',
                    [
                      'get',
                      `${wind ? RISKS.fire.attributes.windRisk : RISKS.fire.attributes.baseRisk}`,
                    ],
                  ],
                  RISKS.fire.bounds.mid,
                ],
                colorExpression,
                get(theme, 'rawColors.muted'),
              ],
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'highlighted'], false],
              2,
              0.5,
            ],
          },
        },
        'background',
      )
    })
    map.on('click', handleMapClick)
    map.on('mouseenter', LAYERS.buildings.layerIds.fill, setPointerCursor)
    map.on('mouseleave', LAYERS.buildings.layerIds.fill, resetCursor)

    return () => {
      try {
        if (!map) return
        // map.removeLayer(LAYERS.buildings.layerIds.fill)
        // map.removeLayer(LAYERS.buildings.layerIds.line)
        // map.removeSource(LAYERS.buildings.sourceId)
        // map.off('click', handleMapClick)
        // map.off('mouseenter', LAYERS.buildings.layerIds.fill, setPointerCursor)
        // map.off('mouseleave', LAYERS.buildings.layerIds.fill, resetCursor)
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
  }, [selectedLocation, highlightBuildingAtLocation, map])

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
        [
          '>',
          [
            'to-number',
            [
              'get',
              `${wind ? RISKS.fire.attributes.windRisk : RISKS.fire.attributes.baseRisk}`,
            ],
          ],
          RISKS.fire.bounds.mid,
        ],
        colorExpression,
        get(theme, 'rawColors.muted'),
      ],
    ]

    map.setPaintProperty(
      LAYERS.buildings.layerIds.line,
      'line-color',
      lineColorExpression,
    )
  }, [map, colorExpression, wind, theme, timeHorizon])

  return null
}

export default Buildings
