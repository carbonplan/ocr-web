import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { useSelectedPoint } from '@/hooks/useSelectedPoint'
import { resolveHazardDataset } from '@/lib/hazards'
import { FdpPointData, queryFdpPoint } from '@/lib/fdp-query'

export type FdpPointQuery =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'success'; data: FdpPointData }

// Every FDP variable at the selected building or area, whichever layer the map
// shows; values are in store units
export const useFdpPoint = (): FdpPointQuery => {
  const point = useSelectedPoint()
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const [query, setQuery] = useState<FdpPointQuery>({ status: 'idle' })

  useEffect(() => {
    if (riskConfig.id !== 'flood' || !point) {
      setQuery({ status: 'idle' })
      return
    }

    const { source } = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })
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
  }, [point, riskConfig, timePeriod, futureWindow])

  return query
}
