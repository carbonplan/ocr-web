import { useEffect, useMemo, useRef } from 'react'
import type { Map as MaplibreMap, MapMouseEvent } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import type { FloodEvent } from '@/lib/historic-events/flood-history'

type Ids = (event: FloodEvent) => (string | number)[]

// pixels around the cursor that count as hovering a record
const HIT_TOLERANCE = 4

// One flood source's record ids near the selected point, held through
// 'loading' so clicking between points doesn't briefly undim every record,
// and the hovered event's ids marked with feature state. Hovering one of
// those records in `pickLayers` hovers its event.
export const useFloodHighlights = (
  map: MaplibreMap | null,
  source: { sourceId: string; layerName: string },
  ids: Ids,
  active: boolean,
  pickLayers: string[] = [],
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

  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const eventIdByRecord = useMemo(() => {
    const byRecord = new Map<string, string>()
    if (
      historicEvents.status === 'success' &&
      historicEvents.kind === 'floods'
    ) {
      for (const event of historicEvents.events) {
        for (const id of ids(event)) byRecord.set(String(id), event.id)
      }
    }
    return byRecord
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historicEvents])

  useEffect(() => {
    if (!map || !active || !pickLayers.length || !eventIdByRecord.size) return
    const handleMove = (e: MapMouseEvent) => {
      const layers = pickLayers.filter((id) => map.getLayer(id))
      if (!layers.length) return
      const { x, y } = e.point
      const features = map.queryRenderedFeatures(
        [
          [x - HIT_TOLERANCE, y - HIT_TOLERANCE],
          [x + HIT_TOLERANCE, y + HIT_TOLERANCE],
        ],
        { layers },
      )
      const hit = features.find((f) => eventIdByRecord.has(String(f.id)))
      const eventId = hit ? eventIdByRecord.get(String(hit.id))! : null
      map.getCanvas().style.cursor = eventId ? 'pointer' : ''
      if (eventId !== useStore.getState().hoveredEventId)
        setHoveredEventId(eventId)
    }
    const handleLeave = () => {
      map.getCanvas().style.cursor = ''
      setHoveredEventId(null)
    }
    map.on('mousemove', handleMove)
    map.on('mouseout', handleLeave)
    return () => {
      map.off('mousemove', handleMove)
      map.off('mouseout', handleLeave)
      map.getCanvas().style.cursor = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, active, eventIdByRecord, setHoveredEventId])

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
