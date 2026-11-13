import { useEffect, useState } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { GeoJSONSource } from 'maplibre-gl'
import { buffer, featureCollection, union } from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { useStore } from '@/lib/store'
import { HISTORIC_STORMS_LAYER_ID } from '@/lib/historic-events'
import { loadStormTracks } from '@/lib/historic-events/storm-tracks'

const SOURCE_ID = 'storm-swath'
const FILL_ID = 'storm-swath-fill'
const LINE_ID = 'storm-swath-line'
const BEFORE_ID = 'storm-tracks-line'

const EMPTY = featureCollection([])

// Where the selected storm's 34 kt winds reached: each segment grown by its R34.
const swathFor = async (sid: string) => {
  const { features } = await loadStormTracks()
  const parts = features
    .filter((f) => f.properties.sid === sid && f.properties.r34_nmi)
    .map((f) =>
      buffer(f, f.properties.r34_nmi!, { units: 'nauticalmiles', steps: 8 }),
    )
    .filter((f): f is Feature<Polygon | MultiPolygon> => Boolean(f))
  if (parts.length === 0) return EMPTY
  const merged = parts.length > 1 ? union(featureCollection(parts)) : parts[0]
  return merged ? featureCollection([merged]) : EMPTY
}

const StormSwath = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'hurricane' &&
      state.mapLayer === HISTORIC_STORMS_LAYER_ID,
  )
  const selectedStormId = useStore((state) => state.selectedStormId)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!map) return
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data: EMPTY })
    }
    const before = map.getLayer(BEFORE_ID) ? BEFORE_ID : undefined
    if (!map.getLayer(FILL_ID)) {
      map.addLayer(
        {
          id: FILL_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: { 'fill-opacity': 0.15 },
        },
        before,
      )
    }
    if (!map.getLayer(LINE_ID)) {
      map.addLayer(
        {
          id: LINE_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: { 'line-width': 1, 'line-dasharray': [2, 2] },
        },
        before,
      )
    }
    setReady(true)
  }, [map])

  useEffect(() => {
    if (!map || !ready) return
    const color = get(theme, 'rawColors.primary')
    map.setPaintProperty(FILL_ID, 'fill-color', color)
    map.setPaintProperty(LINE_ID, 'line-color', color)
  }, [map, ready, theme])

  useEffect(() => {
    if (!map || !ready) return
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (!active || !selectedStormId) {
      source?.setData(EMPTY)
      return
    }
    let cancelled = false
    swathFor(selectedStormId)
      .then((data) => {
        if (!cancelled) source?.setData(data)
      })
      .catch((error) => console.error('Storm swath failed:', error))
    return () => {
      cancelled = true
    }
  }, [map, ready, active, selectedStormId])

  return null
}

export default StormSwath
