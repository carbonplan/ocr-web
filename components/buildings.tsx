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

  const isUserClick = useRef(false)

  const colormap = useThemedColormap(RISKS.fire.colormap, { format: 'hex' })

  const colorExpression: ExpressionSpecification = useMemo(() => {
    if (!colormap || colormap.length === 0) {
      return ['literal', 'transparent']
    }

    const stops: (string | number)[] = []
    colormap.forEach((color: string, index: number) => {
      const value =
        RISKS.fire.bounds.min +
        (index / (colormap.length - 1)) *
          (RISKS.fire.bounds.max - RISKS.fire.bounds.min)
      stops.push(value, color)
    })

    return [
      'interpolate',
      ['linear'],
      [
        'to-number',
        [
          'get',
          `${wind ? RISKS.fire.attributes.windRisk : RISKS.fire.attributes.baseRisk}`,
        ],
      ],
      ...stops,
    ]
  }, [colormap, wind])

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
        map.removeLayer(LAYERS.buildings.layerIds.fill)
        map.removeLayer(LAYERS.buildings.layerIds.line)
        map.removeSource(LAYERS.buildings.sourceId)
        map.off('click', handleMapClick)
        map.off('mouseenter', LAYERS.buildings.layerIds.fill, setPointerCursor)
        map.off('mouseleave', LAYERS.buildings.layerIds.fill, resetCursor)
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
  }, [map, colorExpression, wind, theme])

  return null
}

export default Buildings
