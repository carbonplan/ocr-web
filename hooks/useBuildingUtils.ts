import { useCallback } from 'react'
import { centerOfMass, distance } from '@turf/turf'
import { LAYERS } from '@/lib/config'
import { useStore } from '@/lib/store'
import { Building } from '@/types/location'
import { updateSelectedBuildingUrl } from '@/lib/url-utils'

export const useBuildingUtils = () => {
  const map = useStore((state) => state.map)
  const setSelectedBuilding = useStore((state) => state.setSelectedBuilding)
  const queryGeographiesAtPoint = useStore(
    (state) => state.queryGeographiesAtPoint,
  )

  const highlightBuildingAtLocation = useCallback(
    (lng: number, lat: number): boolean => {
      if (
        !map?.getSource(LAYERS.buildings.sourceId) ||
        !map?.getLayer(LAYERS.buildings.layerIds.fill)
      ) {
        return false
      }

      map.removeFeatureState({
        source: LAYERS.buildings.sourceId,
        sourceLayer: LAYERS.buildings.layerName,
      })

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
          const [centroidLng, centroidLat] = featuresWithDistance[0].centroid

          setSelectedBuilding(closestBuilding as Building)
          updateSelectedBuildingUrl({ lat: centroidLat, lng: centroidLng })

          queryGeographiesAtPoint(centroidLng, centroidLat)

          map.setFeatureState(
            {
              source: LAYERS.buildings.sourceId,
              id: closestBuilding.id,
              sourceLayer: LAYERS.buildings.layerName,
            },
            { selected: true },
          )
          return true
        }
      }
      return false
    },
    [map, setSelectedBuilding, queryGeographiesAtPoint],
  )

  return {
    highlightBuildingAtLocation,
  }
}
