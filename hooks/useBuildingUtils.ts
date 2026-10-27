import { useCallback } from 'react'
import { centerOfMass, distance } from '@turf/turf'
import { readRow } from 'geoparquet-lod/maplibre'
import { BUILDING_DETAIL_COLUMNS, DATA_URLS, LAYERS } from '@/lib/config'
import { useStore } from '@/lib/store'
import { Building } from '@/types/location'
import { updateSelectedBuildingUrl } from '@/lib/url-utils'
import { useReverseGeocode } from '@/hooks/useReverseGeocode'

export const useBuildingUtils = () => {
  const map = useStore((state) => state.map)
  const setSelectedBuilding = useStore((state) => state.setSelectedBuilding)
  const setSelectedLocation = useStore((state) => state.setSelectedLocation)
  const queryGeographiesById = useStore((state) => state.queryGeographiesById)
  const cancelGeographyQueries = useStore(
    (state) => state.cancelGeographyQueries,
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
      // ids are row numbers, so 0 is a building
      if (!map || building.id === undefined || building.id === null) return

      const { easeTo = true, fetchAddress: shouldFetchAddress = true } = options

      const center = centerOfMass(building)
      const [lng, lat] = center.geometry.coordinates as [number, number]

      // a rendered feature's geometry is a getter that spreading drops
      const selected: Building = {
        ...building,
        geometry: building.geometry,
        properties: { ...building.properties },
      }
      setSelectedBuilding(selected)
      // the last building's regions, and any lookup of them still in flight,
      // no longer apply; region actions wait for this building's regions
      cancelGeographyQueries()
      // the building's block GEOID names the regions it belongs to
      readRow(DATA_URLS.vector.buildings, Number(selected.id), [
        ...BUILDING_DETAIL_COLUMNS,
        'GEOID',
      ])
        .then(({ GEOID, ...details }) => {
          if (useStore.getState().selectedBuilding?.id !== selected.id) return
          setSelectedBuilding({
            ...selected,
            properties: { ...selected.properties, ...details },
          })
          queryGeographiesById(String(GEOID))
        })
        .catch((error) => {
          console.error('Building details failed:', error)
          // no GEOID, so the region lookup the selection awaited never starts
          if (useStore.getState().selectedBuilding?.id === selected.id)
            useStore.getState().setGeographiesLoading(false)
        })
      updateSelectedBuildingUrl({ lat, lng })

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
      queryGeographiesById,
      cancelGeographyQueries,
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
    highlightBuildingAtLocation,
  }
}
