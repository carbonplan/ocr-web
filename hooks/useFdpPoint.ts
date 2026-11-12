import { useEffect, useState } from 'react'
import { centerOfMass } from '@turf/turf'
import { useStore } from '@/lib/store'
import { resolveHazardDataset } from '@/lib/hazards'
import { FdpPointData, queryFdpPoint } from '@/lib/fdp-query'

export type FdpPointQuery =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'success'; data: FdpPointData }

// Every FDP variable at the selected building or area, whichever layer the map
// shows; values are in store units
export const useFdpPoint = (): FdpPointQuery => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const [query, setQuery] = useState<FdpPointQuery>({ status: 'idle' })

  useEffect(() => {
    if (riskConfig.id !== 'flood' || (!selectedBuilding && !selectedArea)) {
      setQuery({ status: 'idle' })
      return
    }

    const { source } = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })
    const point = selectedArea
      ? ([selectedArea.lng, selectedArea.lat] as [number, number])
      : (centerOfMass(selectedBuilding!).geometry.coordinates as [
          number,
          number,
        ])
    let cancelled = false
    setQuery({ status: 'loading' })

    queryFdpPoint(source, point)
      .then((data) => {
        if (cancelled) return
        setQuery(data ? { status: 'success', data } : { status: 'error' })
      })
      .catch((error) => {
        if (cancelled) return
        console.error('FDP point query failed:', error)
        setQuery({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [selectedBuilding, selectedArea, riskConfig, timePeriod, futureWindow])

  return query
}
