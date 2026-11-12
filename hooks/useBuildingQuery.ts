import { useEffect } from 'react'
import { centerOfMass } from '@turf/turf'
import { useStore, BuildingQueryState } from '@/lib/store'
import {
  RISK_LAYER_ID,
  getMapLayer,
  getShownVariables,
  getUnitScale,
  resolveHazardDataset,
  resolveLayerVariable,
  toDisplayUnits,
} from '@/lib/hazards'
import { queryChazPoint } from '@/lib/chaz-query'
import { getZarrLayerId, queryRasterPoint } from '@/lib/raster-query'
import { queryStorePoint } from '@/lib/store-point'

// Normalizes BuildingQueryState.value to display units.
export const useBuildingQuery = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const setBuildingQuery = useStore((state) => state.setBuildingQuery)
  const mapLayerId = useStore((state) => state.mapLayer)
  // the raster path reads through the layer's selector, so a new slice needs a
  // new query
  const selectorValues = useStore((state) => state.selectorValues)
  const zarrLayer = useStore((state) => state.zarrLayer)
  // null off the raster path, so a layer rebuild doesn't re-fire those queries
  const queryLayer = riskConfig.pointQuery === 'raster' ? zarrLayer : null

  // an attributes-mode point has no building row: the values on screen are read
  // from the store there instead
  useEffect(() => {
    if (riskConfig.buildingsMode !== 'attributes' || !selectedArea) return
    const dataset = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })
    const columns = getShownVariables(riskConfig, { timePeriod, futureWindow })
    let cancelled = false
    setBuildingQuery({ status: 'loading' })
    queryStorePoint(dataset, columns, [selectedArea.lng, selectedArea.lat])
      .then((values) => {
        if (cancelled) return
        const value = toDisplayUnits(
          riskConfig,
          RISK_LAYER_ID,
          values[dataset.variable],
        )
        setBuildingQuery(
          value === null
            ? { status: 'error' }
            : { status: 'success', value, values },
        )
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Point query failed:', error)
        setBuildingQuery({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [selectedArea, riskConfig, timePeriod, futureWindow, setBuildingQuery])

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

    const variable = resolveLayerVariable(riskConfig, mapLayerId, {
      timePeriod,
      futureWindow,
    })

    setBuildingQuery({ status: 'loading' })

    // the layer still belongs to the previous hazard; the effect re-runs once
    // the right one is in the store
    if (
      riskConfig.pointQuery === 'raster' &&
      queryLayer?.id !== getZarrLayerId(dataset.source, variable)
    ) {
      return
    }

    const controller = new AbortController()

    const query = async (): Promise<BuildingQueryState> => {
      if (riskConfig.pointQuery === 'raster') {
        const value = await queryRasterPoint(
          queryLayer!,
          variable,
          point,
          controller.signal,
        )
        const range = getMapLayer(riskConfig, mapLayerId)?.validRange
        if (value === null || (range && (value < range[0] || value > range[1])))
          return { status: 'error' }
        // the raster path reads the active layer's variable, so it scales
        // with that layer's unit
        return {
          status: 'success',
          value: value * getUnitScale(riskConfig, mapLayerId),
        }
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
    queryLayer,
    selectorValues,
  ])
}
