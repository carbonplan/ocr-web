import { useEffect } from 'react'
import { centerOfMass } from '@turf/turf'
import { useStore, HistoricEventsState } from '@/lib/store'
import { queryStormsAtPoint } from '@/lib/historic-events/storm-winds'
import { queryFiresAtPoint } from '@/lib/historic-events/fire-perimeters'

// Looks up the historic events at the selected point for the active hazard.
// Runs whether or not the events layer is showing, so the sidebar count is
// always populated.
export const useHistoricEvents = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const hazard = useStore((state) => state.riskConfig.id)
  const setHistoricEvents = useStore((state) => state.setHistoricEvents)

  useEffect(() => {
    if (!selectedBuilding && !selectedArea) return
    if (hazard !== 'wind' && hazard !== 'fire') {
      setHistoricEvents({ status: 'idle' })
      return
    }

    const point = selectedArea
      ? ([selectedArea.lng, selectedArea.lat] as [number, number])
      : (centerOfMass(selectedBuilding!).geometry.coordinates as [
          number,
          number,
        ])

    setHistoricEvents({ status: 'loading' })
    useStore.getState().setSelectedStormId(null)
    const controller = new AbortController()

    const query = async (): Promise<HistoricEventsState> => {
      if (hazard === 'wind') {
        const events = await queryStormsAtPoint(point)
        return { status: 'success', kind: 'storms', events }
      }
      const { fires, nearest } = await queryFiresAtPoint(
        point,
        controller.signal,
      )
      return { status: 'success', kind: 'fires', events: fires, nearest }
    }

    query()
      .then((state) => {
        if (controller.signal.aborted) return
        setHistoricEvents(state)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.error('Historic events query failed:', error)
        setHistoricEvents({ status: 'error' })
      })

    return () => controller.abort()
  }, [selectedBuilding, selectedArea, hazard, setHistoricEvents])
}
