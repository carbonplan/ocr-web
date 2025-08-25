import { useCallback } from 'react'
import { centerOfMass, distance } from '@turf/turf'
import { LAYERS } from '@/lib/config'
import { useStore } from '@/lib/store'

export const useBuildingUtils = () => {
  const map = useStore((state) => state.map)
  const setSelectedBuilding = useStore((state) => state.setSelectedBuilding)
  const setActiveGeographies = useStore((state) => state.setActiveGeographies)
  const setSelectedCoordinates = useStore(
    (state) => state.setSelectedCoordinates,
  )

  const queryGeographiesAtPoint = useCallback(
    (lng: number, lat: number) => {
      if (!map) return

      const countyFeatures = map.queryRenderedFeatures(
        map.project([lng, lat]),
        {
          layers: [LAYERS.counties.layerIds.fill],
        },
      )
      const tractFeatures = map.queryRenderedFeatures(map.project([lng, lat]), {
        layers: [LAYERS.censusTracts.layerIds.fill],
      })

      setActiveGeographies({
        censusTract:
          tractFeatures.length > 0 ? tractFeatures[0].properties : null,
        county: countyFeatures.length > 0 ? countyFeatures[0].properties : null,
      })
    },
    [map, setActiveGeographies],
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
            return { feature, distance: distanceValue }
          })
          .sort((a, b) => a.distance - b.distance)

        if (featuresWithDistance.length > 0) {
          const closestBuilding = featuresWithDistance[0].feature
          setSelectedBuilding(closestBuilding.properties)
          setSelectedCoordinates({ lat, lng })

          queryGeographiesAtPoint(lng, lat)

          map.setFeatureState(
            {
              source: LAYERS.buildings.sourceId,
              id: closestBuilding.id,
              sourceLayer: LAYERS.buildings.layerName,
            },
            { selected: true },
          )
        }
      }
    },
    [map, setSelectedBuilding, queryGeographiesAtPoint, setSelectedCoordinates],
  )

  return {
    queryGeographiesAtPoint,
    highlightBuildingAtLocation,
  }
}
