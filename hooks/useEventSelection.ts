import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useSelectedPoint } from '@/hooks/useSelectedPoint'
import { unionBBox, type BBox } from '@/lib/historic-events/vector-tiles'

// Selecting a historic event from its sidebar row: clicking toggles the
// selection and, on select, pans or zooms out just enough to show the event
// with the selected point. The selected row scrolls into view however it was
// selected, including from the map.
export const useEventSelection = () => {
  const map = useStore((state) => state.map)
  const point = useSelectedPoint()
  const hoveredEventId = useStore((state) => state.hoveredEventId)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const selectedEventId = useStore((state) => state.selectedEventId)
  const setSelectedEventId = useStore((state) => state.setSelectedEventId)

  const rowRefs = useRef(new Map<string, HTMLElement>())
  useEffect(() => {
    if (!selectedEventId) return
    rowRefs.current
      .get(selectedEventId)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedEventId])

  const select = useCallback(
    (id: string, bbox: BBox | null) => {
      if (selectedEventId === id) {
        setSelectedEventId(null)
        return
      }
      setSelectedEventId(id)
      if (!map || !point || !bbox) return
      const [lng, lat] = point
      const [west, south, east, north] = unionBBox(bbox, [lng, lat, lng, lat])
      const view = map.getBounds()
      if (view.contains([west, south]) && view.contains([east, north])) return
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: 100, duration: 500, maxZoom: map.getZoom() },
      )
    },
    [map, point, selectedEventId, setSelectedEventId],
  )

  // props for an event's row; it reads as active while hovered here or on the
  // map, or while selected
  const rowProps = (id: string, bbox: BBox | null) => ({
    ref: (node: HTMLElement | null) => {
      if (node) rowRefs.current.set(id, node)
      else rowRefs.current.delete(id)
    },
    onMouseEnter: () => setHoveredEventId(id),
    onMouseLeave: () => setHoveredEventId(null),
    onClick: () => select(id, bbox),
  })

  const isActive = (id: string) =>
    hoveredEventId === id || selectedEventId === id

  return { rowProps, isActive }
}

// row styles shared by the historic event lists: hovering or selecting an
// event changes only its text color
export const eventRowSx = (active: boolean) => ({
  cursor: 'pointer',
  color: active ? 'primary' : 'secondary',
  transition: 'color 0.15s',
  '&:hover': { color: 'primary' },
})
