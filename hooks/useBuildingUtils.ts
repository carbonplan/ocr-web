import { useCallback } from 'react'
import { centerOfMass, distance } from '@turf/turf'
import { LAYERS } from '@/lib/config'
import { useStore } from '@/lib/store'
import { Building } from '@/types/location'
import {
  updateSelectedAreaUrl,
  updateSelectedBuildingUrl,
} from '@/lib/url-utils'
import { useReverseGeocode } from '@/hooks/useReverseGeocode'

export const useBuildingUtils = () => {
  const map = useStore((state) => state.map)
  const setSelectedBuilding = useStore((state) => state.setSelectedBuilding)
  const setSelectedArea = useStore((state) => state.setSelectedArea)
  const setSelectedLocation = useStore((state) => state.setSelectedLocation)
  const queryGeographiesAtPoint = useStore(
    (state) => state.queryGeographiesAtPoint,
  )
  const { fetchAddress } = useReverseGeocode()

  const selectBuilding = useCallback(
    (
      building: Building,
      options: { easeTo?: boolean; fetchAddress?: boolean } = {
        easeTo: true,
        fetchAddress: true,
      },
    ) => {
      if (!map || !building.id) return

      const { easeTo = true, fetchAddress: shouldFetchAddress = true } = options

      const center = centerOfMass(building)
      const [lng, lat] = center.geometry.coordinates as [number, number]

      setSelectedBuilding(building)
      updateSelectedBuildingUrl({ lat, lng })
      queryGeographiesAtPoint(lng, lat)

      map.removeFeatureState({
        source: LAYERS.buildings.sourceId,
        sourceLayer: LAYERS.buildings.layerName,
      })
      map.setFeatureState(
        {
          source: LAYERS.buildings.sourceId,
          id: building.id,
          sourceLayer: LAYERS.buildings.layerName,
        },
        { selected: true },
      )

      if (easeTo) {
        map.easeTo({ center: [lng, lat] })
      }
      if (shouldFetchAddress) {
        setSelectedLocation(null)
        fetchAddress(lat, lng).then((location) => {
          if (location && useStore.getState().selectedBuilding) {
            setSelectedLocation(location)
          }
        })
      }
    },
    [
      map,
      setSelectedBuilding,
      setSelectedLocation,
      queryGeographiesAtPoint,
      fetchAddress,
    ],
  )

  const selectArea = useCallback(
    (lng: number, lat: number) => {
      if (!map) return

      // removeFeatureState throws while the style is still loading
      if (map.isStyleLoaded()) {
        map.removeFeatureState({
          source: LAYERS.buildings.sourceId,
          sourceLayer: LAYERS.buildings.layerName,
        })
      }
      setSelectedArea({ lat, lng })
      updateSelectedAreaUrl({ lat, lng })
      queryGeographiesAtPoint(lng, lat)

      setSelectedLocation(null)
      fetchAddress(lat, lng).then((location) => {
        if (location && useStore.getState().selectedArea) {
          setSelectedLocation(location)
        }
      })
    },
    [
      map,
      setSelectedArea,
      setSelectedLocation,
      queryGeographiesAtPoint,
      fetchAddress,
    ],
  )

  const highlightBuildingAtLocation = useCallback(
    (
      lng: number,
      lat: number,
      options: { easeTo?: boolean; fetchAddress?: boolean } = {
        easeTo: true,
        fetchAddress: true,
      },
    ): boolean => {
      if (
        !map?.getSource(LAYERS.buildings.sourceId) ||
        !map?.getLayer(LAYERS.buildings.layerIds.fill)
      ) {
        return false
      }

      const point = map.project([lng, lat])
      const tolerance = 100
      const bbox: [[number, number], [number, number]] = [
        [point.x - tolerance, point.y - tolerance],
        [point.x + tolerance, point.y + tolerance],
      ]

      const features = map.queryRenderedFeatures(bbox, {
        layers: [LAYERS.buildings.layerIds.fill],
      })

      if (features.length > 0) {
        const featuresWithDistance = features
          .map((feature) => {
            const center = centerOfMass(feature)
            const centroid = center.geometry.coordinates as [number, number]

            const distanceValue = distance([lng, lat], centroid, {
              units: 'meters',
            })
            return { feature, distance: distanceValue, centroid }
          })
          .sort((a, b) => a.distance - b.distance)

        if (featuresWithDistance.length > 0) {
          const closestBuilding = featuresWithDistance[0].feature
          selectBuilding(closestBuilding as unknown as Building, options)
          return true
        }
      }
      return false
    },
    [map, selectBuilding],
  )

  return {
    selectBuilding,
    selectArea,
    highlightBuildingAtLocation,
  }
}
