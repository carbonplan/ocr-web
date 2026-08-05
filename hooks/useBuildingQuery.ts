import { useEffect } from 'react'
import { centerOfMass } from '@turf/turf'
import { useStore } from '@/lib/store'
import { onceMapIdle } from '@/lib/map-utils'
import { resolveHazardDataset } from '@/lib/hazards'

// For query-mode hazards, fetches the raster value at the selected building's
// centroid whenever the selection or the active dataset changes. The zarr
// layer instance is rebuilt when the store/period changes, so re-queries
// trigger via the zarrLayer identity.
//
// queryData returns an empty result until the layer has initialized: store
// metadata must load (awaited via zarrLayerReady) and a render pass must
// commit the active pyramid level. The render commit has no direct signal,
// so an empty result is retried once after the map goes idle.
export const useBuildingQuery = () => {
  const map = useStore((state) => state.map)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const zarrLayer = useStore((state) => state.zarrLayer)
  const zarrLayerReady = useStore((state) => state.zarrLayerReady)
  const setBuildingQuery = useStore((state) => state.setBuildingQuery)

  useEffect(() => {
    if (riskConfig.buildingsMode !== 'query') return
    if (!selectedBuilding || !zarrLayer) return

    const dataset = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })
    const [lng, lat] = centerOfMass(selectedBuilding).geometry.coordinates as [
      number,
      number,
    ]

    const controller = new AbortController()
    setBuildingQuery({ status: 'loading' })

    const queryValue = async (): Promise<number | null> => {
      const result = await zarrLayer.queryData(
        { type: 'Point', coordinates: [lng, lat] },
        undefined,
        { signal: controller.signal },
      )
      const values = result[dataset.variable]
      const raw = Array.isArray(values) ? (values.flat()[0] as number) : null
      return raw == null || Number.isNaN(raw) ? null : raw
    }

    const query = async () => {
      await zarrLayerReady
      if (controller.signal.aborted) return
      let raw = await queryValue()
      if (raw === null && map) {
        await onceMapIdle(map)
        if (controller.signal.aborted) return
        raw = await queryValue()
      }
      if (controller.signal.aborted) return
      if (raw === null) {
        setBuildingQuery({ status: 'error' })
        return
      }
      setBuildingQuery({
        status: 'success',
        // display units, matching binBoundaries
        value: raw * riskConfig.unitScale,
      })
    }

    query().catch((error) => {
      if (error?.name === 'AbortError' || controller.signal.aborted) return
      console.error('Building query failed:', error)
      setBuildingQuery({ status: 'error' })
    })

    return () => controller.abort()
  }, [
    map,
    selectedBuilding,
    riskConfig,
    timePeriod,
    futureWindow,
    zarrLayer,
    zarrLayerReady,
    setBuildingQuery,
  ])
}
