import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { LngLat, MapMouseEvent } from 'maplibre-gl'
import { useLocationStore } from '@/store/location'
import { useThemedColormap } from '@carbonplan/colormaps'

const buildingSource =
  'https://carbonplan-ocr.s3.amazonaws.com/intermediate/fire-risk/vector/two_variable_layer.pmtiles'
const buildingsLayer = 'risk'
const baseRiskLayer = 'USFS_risk'
const windLayer = 'wind_risk'

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

  const isUserClick = useRef(false)

  const colormap = useThemedColormap('reds', { format: 'hex' })

  const colorExpression = useMemo(() => {
    if (!colormap || colormap.length === 0) {
      return 'transparent'
    }

    const minRisk = 0
    const maxRisk = 0.001
    const stops: (string | number)[] = []

    colormap.forEach((color: string, index: number) => {
      const value =
        minRisk + (index / (colormap.length - 1)) * (maxRisk - minRisk)
      stops.push(value, color)
    })

    return [
      'case',
      ['!=', ['get', `${wind ? windLayer : baseRiskLayer}`], null],
      [
        'interpolate',
        ['linear'],
        ['to-number', ['get', `${wind ? windLayer : baseRiskLayer}`]],
        ...stops,
      ],
      'transparent',
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
        layers: ['buildings-fill'],
      })

      if (features.length > 0) {
        setSelectedBuilding(features[0].properties)
        const feature = features[0]
        const { lng, lat } = e.lngLat
        isUserClick.current = true

        if (feature.id) {
          map.removeFeatureState({
            source: 'buildings',
            sourceLayer: buildingsLayer,
          })

          map.setFeatureState(
            {
              source: 'buildings',
              id: feature.id,
              sourceLayer: buildingsLayer,
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
          source: 'buildings',
          sourceLayer: buildingsLayer,
        })
      }
    },
    [map, setSelectedBuilding, setSelectedLocation],
  )

  useEffect(() => {
    if (!selectedBuilding && map?.isStyleLoaded()) {
      map.removeFeatureState({
        source: 'buildings',
        sourceLayer: buildingsLayer,
      })
    }
  }, [selectedBuilding, map])

  useEffect(() => {
    if (!map) return

    map.on('load', () => {
      map.addSource('buildings', {
        type: 'vector',
        url: `pmtiles://${buildingSource}`,
      })
      map.addLayer(
        {
          id: 'buildings-fill',
          type: 'fill',
          source: 'buildings',
          'source-layer': buildingsLayer,
          paint: {
            'fill-color': colorExpression,
            // 'fill-opacity': 0.5,
          },
        },
        'background',
      )
      map.addLayer(
        {
          id: 'buildings-line',
          type: 'line',
          source: 'buildings',
          'source-layer': buildingsLayer,
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'highlighted'], false],
              get(theme, 'rawColors.primary'),
              get(theme, 'rawColors.muted'),
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'highlighted'], false],
              3,
              0.5,
            ],
          },
        },
        'background',
      )
    })
    map.on('click', handleMapClick)
    map.on('mouseenter', 'buildings-fill', setPointerCursor)
    map.on('mouseleave', 'buildings-fill', resetCursor)

    return () => {
      try {
        if (!map) return
        map.removeLayer('buildings-fill')
        map.removeLayer('buildings-line')
        map.removeSource('buildings')
        map.off('click', handleMapClick)
        map.off('mouseenter', 'buildings-fill', setPointerCursor)
        map.off('mouseleave', 'buildings-fill', resetCursor)
      } catch (error) {
        console.error('Error removing buildings layers:', error)
      }
    }
  }, [
    map,
    handleMapClick,
    setPointerCursor,
    resetCursor,
    colorExpression,
    theme,
  ])

  useEffect(() => {
    if (!map || !selectedLocation || !map.isStyleLoaded()) return

    if (!isUserClick.current) {
      const addressLocation = new LngLat(
        selectedLocation.position.lng,
        selectedLocation.position.lat,
      )
      map.flyTo({
        center: addressLocation,
        zoom: selectedLocation.address.houseNumber ? 17 : 12,
        offset: [250, 0], // TODO: make dynamic w/ sidebar width
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
  }, [selectedLocation])

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return

    map.setPaintProperty('buildings-line', 'line-color', [
      'case',
      ['boolean', ['feature-state', 'highlighted'], false],
      get(theme, 'rawColors.primary'),
      'transparent',
    ])
  }, [map, theme])

  useEffect(() => {
    if (!map || !map.isStyleLoaded() || !map.getLayer('buildings-fill')) return

    map.setPaintProperty('buildings-fill', 'fill-color', colorExpression)
  }, [map, colorExpression])

  const highlightBuildingAtLocation = useCallback(
    (lng: number, lat: number) => {
      if (!map?.getSource('buildings') || !map?.getLayer('buildings-fill')) {
        return
      }

      map.removeFeatureState({
        source: 'buildings',
        sourceLayer: buildingsLayer,
      })

      const point = map.project([lng, lat])
      const features = map.queryRenderedFeatures(point, {
        layers: ['buildings-fill'],
      })

      if (features.length > 0) {
        const buildingFeature = features[0]
        setSelectedBuilding(buildingFeature.properties)
        if (buildingFeature.id) {
          map.setFeatureState(
            {
              source: 'buildings',
              id: buildingFeature.id,
              sourceLayer: buildingsLayer,
            },
            { highlighted: true },
          )
        }
      }
    },
    [map, setSelectedBuilding],
  )

  return null
}

export default Buildings
