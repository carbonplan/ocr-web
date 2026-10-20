import { useEffect, useMemo, useRef } from 'react'
import type { Map as MaplibreMap } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import type { FloodEvent } from '@/lib/historic-events/flood-history'

type Ids = (event: FloodEvent) => (string | number)[]

// One flood source's record ids near the selected point, held through
// 'loading' so clicking between points doesn't briefly undim every record,
// and the hovered event's ids marked with feature state.
export const useFloodHighlights = (
  map: MaplibreMap | null,
  source: { sourceId: string; layerName: string },
  ids: Ids,
  active: boolean,
) => {
  const historicEvents = useStore((state) => state.historicEvents)
  const hoveredEventId = useStore((state) => state.hoveredEventId)

  const relevantRef = useRef<(string | number)[] | null>(null)
  const relevantIds = useMemo(() => {
    if (historicEvents.status !== 'loading') {
      relevantRef.current =
        historicEvents.status === 'success' && historicEvents.kind === 'floods'
          ? historicEvents.events.flatMap(ids)
          : null
    }
    return relevantRef.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historicEvents])

  const previousHoverRef = useRef<string[]>([])
  useEffect(() => {
    if (!map?.getSource(source.sourceId)) return
    const key = (id: string) => ({
      source: source.sourceId,
      sourceLayer: source.layerName,
      id,
    })
    for (const id of previousHoverRef.current) {
      map.setFeatureState(key(id), { hover: false })
    }
    const event =
      active &&
      historicEvents.status === 'success' &&
      historicEvents.kind === 'floods'
        ? historicEvents.events.find((e) => e.id === hoveredEventId)
        : undefined
    // maplibre stringifies promoted ids
    const hovered = event ? ids(event).map(String) : []
    for (const id of hovered) map.setFeatureState(key(id), { hover: true })
    previousHoverRef.current = hovered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hoveredEventId, historicEvents, active])

  return relevantIds
}
