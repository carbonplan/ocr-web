import { useEffect } from 'react'
import { centerOfMass } from '@turf/turf'
import { useStore, BuildingQueryState } from '@/lib/store'
import { getMapLayer, resolveHazardDataset } from '@/lib/hazards'
import { queryChazPoint } from '@/lib/chaz-query'
import { getZarrLayerId, queryRasterPoint } from '@/lib/raster-query'

// Queries the selected building centroid or map point for query-mode hazards.
// BuildingQueryState.value is normalized to display units.
export const useBuildingQuery = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const setBuildingQuery = useStore((state) => state.setBuildingQuery)
  const mapLayerId = useStore((state) => state.mapLayer)
  const map = useStore((state) => state.map)
  const zarrLayer = useStore((state) => state.zarrLayer)
  // only the raster path reads the render layer; holding it at null otherwise
  // keeps a layer rebuild from re-firing the store-side query
  const queryLayer = riskConfig.pointQuery === 'raster' ? zarrLayer : null

  useEffect(() => {
    if (riskConfig.buildingsMode !== 'query') return
    if (!selectedBuilding && !selectedArea) return

    const dataset = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })
    const point = selectedArea
      ? ([selectedArea.lng, selectedArea.lat] as [number, number])
      : (centerOfMass(selectedBuilding!).geometry.coordinates as [
          number,
          number,
        ])

    const variable =
      getMapLayer(riskConfig, mapLayerId)?.variable ?? dataset.variable

    setBuildingQuery({ status: 'loading' })

    // the layer is still initializing, or still belongs to the hazard being
    // switched away from; the effect re-runs once the right one is in the store
    if (
      riskConfig.pointQuery === 'raster' &&
      (!map || queryLayer?.id !== getZarrLayerId(dataset.source, variable))
    ) {
      return
    }

    const controller = new AbortController()

    const query = async (): Promise<BuildingQueryState> => {
      if (riskConfig.pointQuery === 'raster') {
        await useStore.getState().zarrLayerReady
        const value = await queryRasterPoint(
          map!,
          queryLayer!,
          variable,
          point,
          controller.signal,
        )
        if (value === null) return { status: 'error' }
        return { status: 'success', value: value * riskConfig.unitScale }
      }

      const detail = await queryChazPoint(dataset.source, point)
      if (!detail || detail.ead === null) return { status: 'error' }
      return {
        status: 'success',
        value: detail.ead * riskConfig.unitScale,
        detail,
      }
    }

    query()
      .then((state) => {
        if (controller.signal.aborted) return
        setBuildingQuery(state)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.error('Building query failed:', error)
        setBuildingQuery({ status: 'error' })
      })

    return () => controller.abort()
  }, [
    selectedBuilding,
    selectedArea,
    riskConfig,
    timePeriod,
    futureWindow,
    setBuildingQuery,
    mapLayerId,
    map,
    queryLayer,
  ])
}
