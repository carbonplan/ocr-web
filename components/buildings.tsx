import { useCallback, useEffect, useRef } from 'react'
import { useThemeUI } from 'theme-ui'
import { LngLat, MapMouseEvent } from 'maplibre-gl'
import { useLocationStore } from '@/store/location'

const buildingSource =
  'https://carbonplan-ocr.s3.us-west-2.amazonaws.com/intermediate/fire-risk/vector/CA_12_risk_scores.pmtiles'
const buildingsLayer = 'CA_12_risk_scoresfgb'

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
  const isUserClick = useRef(false)

  useEffect(() => {
    if (!selectedBuilding && map?.isStyleLoaded()) {
      map.removeFeatureState({
        source: 'buildings',
        sourceLayer: buildingsLayer,
      })
    }
  }, [selectedBuilding])

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
            'fill-color': '#85a2f7',
            'fill-opacity': 0.5,
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
              theme?.rawColors?.primary as string,
              'transparent',
            ],
            'line-width': 3,
          },
        },
        'background',
      )
    })
    map.on('click', 'buildings-fill', handleBuildingClick)
    map.on('mouseenter', 'buildings-fill', setPointerCursor)
    map.on('mouseleave', 'buildings-fill', resetCursor)

    return () => {
      try {
        if (!map) return
        map.removeLayer('buildings-fill')
        map.removeLayer('buildings-line')
        map.removeSource('buildings')
        map.off('click', 'buildings-fill', handleBuildingClick)
        map.off('mouseenter', 'buildings-fill', setPointerCursor)
        map.off('mouseleave', 'buildings-fill', resetCursor)
      } catch (error) {
        console.error('Error removing buildings layers:', error)
      }
    }
  }, [map])

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
      theme?.rawColors?.primary as string,
      'transparent',
    ])
  }, [map, theme])

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

  const handleBuildingClick = useCallback(
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
      }
    },
    [map, setSelectedBuilding, setSelectedLocation],
  )

  return null
}

export default Buildings
