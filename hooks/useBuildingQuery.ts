import { useEffect } from 'react'
import { useSelectedPoint } from '@/hooks/useSelectedPoint'
import { useStore, BuildingQueryState } from '@/lib/store'
import {
  RISK_LAYER_ID,
  getShownVariables,
  resolveHazardDataset,
  toDisplayUnits,
} from '@/lib/hazards'
import { queryChazPoint } from '@/lib/chaz-query'
import { queryStorePoint } from '@/lib/store-point'
import { queryFdpValues } from '@/lib/fdp-query'

// Normalizes BuildingQueryState.value to display units.
export const useBuildingQuery = () => {
  const selectedArea = useStore((state) => state.selectedArea)
  const point = useSelectedPoint()
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const setBuildingQuery = useStore((state) => state.setBuildingQuery)

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
    // the FDP store packs every value at a point into its point group
    const readPoint =
      riskConfig.id === 'flood' ? queryFdpValues : queryStorePoint
    readPoint(dataset, columns, [selectedArea.lng, selectedArea.lat])
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
    if (!point) return

    const dataset = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })

    setBuildingQuery({ status: 'loading' })

    const controller = new AbortController()

    const query = async (): Promise<BuildingQueryState> => {
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
  }, [point, riskConfig, timePeriod, futureWindow, setBuildingQuery])
}
