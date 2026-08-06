import { useEffect } from 'react'
import { centerOfMass } from '@turf/turf'
import { useStore } from '@/lib/store'
import { resolveHazardDataset } from '@/lib/hazards'
import { queryChazPoint } from '@/lib/chaz-query'

// For query-mode hazards, fetches the raster values at the selected
// building's centroid (or the selected map point) whenever the selection or
// the active dataset changes. Reads the store directly with zarrita
// (lib/chaz-query.ts), so the query is independent of the render layer's
// initialization and returns every band the detail panel shows, not just the
// rendered one.
export const useBuildingQuery = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const setBuildingQuery = useStore((state) => state.setBuildingQuery)

  useEffect(() => {
    if (riskConfig.buildingsMode !== 'query') return
    if (!selectedBuilding && !selectedArea) return

    const dataset = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })
    const [lng, lat] = selectedArea
      ? [selectedArea.lng, selectedArea.lat]
      : (centerOfMass(selectedBuilding!).geometry.coordinates as [
          number,
          number,
        ])

    const controller = new AbortController()
    setBuildingQuery({ status: 'loading' })

    queryChazPoint(dataset.source, [lng, lat])
      .then((detail) => {
        if (controller.signal.aborted) return
        if (!detail || detail.ead === null) {
          setBuildingQuery({ status: 'error' })
          return
        }
        setBuildingQuery({
          status: 'success',
          // display units, matching binBoundaries
          value: detail.ead * riskConfig.unitScale,
          detail,
        })
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
  ])
}
