import { useEffect } from 'react'
import { centerOfMass } from '@turf/turf'
import { useStore } from '@/lib/store'
import { resolveHazardDataset } from '@/lib/hazards'

// queryData returns an empty result until the layer's store metadata and
// tile cache are initialized (it does not wait), so retry briefly before
// concluding the building has no data.
const RETRY_DELAY = 400
const MAX_ATTEMPTS = 10

// For query-mode hazards, fetches the raster value at the selected building's
// centroid whenever the selection or the active dataset changes. The zarr
// layer instance is rebuilt when the store/period changes, so re-queries
// trigger via the zarrLayer identity.
export const useBuildingQuery = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const zarrLayer = useStore((state) => state.zarrLayer)
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
    let retryTimeout: ReturnType<typeof setTimeout> | undefined
    setBuildingQuery({ status: 'loading' })

    const attempt = (attemptsLeft: number) => {
      zarrLayer
        .queryData({ type: 'Point', coordinates: [lng, lat] }, undefined, {
          signal: controller.signal,
        })
        .then((result) => {
          if (controller.signal.aborted) return
          const values = result[dataset.variable]
          const raw = Array.isArray(values)
            ? (values.flat()[0] as number)
            : null
          if (raw == null || Number.isNaN(raw)) {
            if (attemptsLeft > 0) {
              retryTimeout = setTimeout(
                () => attempt(attemptsLeft - 1),
                RETRY_DELAY,
              )
            } else {
              setBuildingQuery({ status: 'error' })
            }
            return
          }
          setBuildingQuery({
            status: 'success',
            // display units, matching binBoundaries
            value: raw * riskConfig.unitScale,
          })
        })
        .catch((error) => {
          if (error?.name === 'AbortError' || controller.signal.aborted) return
          console.error('Building query failed:', error)
          setBuildingQuery({ status: 'error' })
        })
    }

    attempt(MAX_ATTEMPTS)

    return () => {
      controller.abort()
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [
    selectedBuilding,
    riskConfig,
    timePeriod,
    futureWindow,
    zarrLayer,
    setBuildingQuery,
  ])
}
