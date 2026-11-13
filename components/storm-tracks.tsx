import { useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import {
  ExpressionSpecification,
  GeoJSONSource,
  MapMouseEvent,
} from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import {
  HISTORIC_STORMS_LAYER_ID,
  MPH_PER_KT,
  TROPICAL_STORM_MPH,
} from '@/lib/historic-events'
import { loadStormTracks } from '@/lib/historic-events/storm-tracks'

const { sourceId, layerIds } = LAYERS.stormTracks
const BEFORE_ID = 'address_label'
// pixels around the cursor that count as hovering a track
const HIT_TOLERANCE = 6

const BINS =
  getMapLayer(RISKS.hurricane, HISTORIC_STORMS_LAYER_ID)?.binBoundaries ?? []
const HIGHLIGHTED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'highlighted'],
  false,
]
// set on the storms that reached the selected point
const RELEVANT: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'relevant'],
  false,
]
const SEGMENT_MPH: ExpressionSpecification = [
  '*',
  ['to-number', ['get', 'usa_wind']],
  MPH_PER_KT,
]
// segments below tropical-storm strength are drawn but not modeled
const WEAK: ExpressionSpecification = ['<', SEGMENT_MPH, TROPICAL_STORM_MPH]

const width = (base: number): ExpressionSpecification => [
  '*',
  ['case', WEAK, 0.6, 1],
  ['case', HIGHLIGHTED, base * 2.5, RELEVANT, base * 1.5, base],
]
const WIDTH: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  2,
  width(0.6),
  5,
  width(1.2),
  8,
  width(2),
  12,
  width(3.5),
]

// Track segments colored by their recorded wind on the same Saffir-Simpson
// scale as the peak winds layer, with the storms that reached the selected
// point drawn over the rest.
const StormTracks = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'hurricane' &&
      state.mapLayer === HISTORIC_STORMS_LAYER_ID,
  )
  const historicEvents = useStore((state) => state.historicEvents)
  const hoveredEventId = useStore((state) => state.hoveredEventId)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const selectedStormId = useStore((state) => state.selectedStormId)

  const colormap = useColormap({ count: BINS.length })

  // held through 'loading' so clicking between points doesn't briefly undim
  // every track
  const relevantSidsRef = useRef<string[] | null>(null)
  const relevantSids = useMemo(() => {
    if (historicEvents.status !== 'loading') {
      relevantSidsRef.current =
        historicEvents.status === 'success' && historicEvents.kind === 'storms'
          ? historicEvents.events.map((storm) => storm.sid)
          : null
    }
    return relevantSidsRef.current
  }, [historicEvents])

  const colorExpression: ExpressionSpecification = useMemo(() => {
    const steps = BINS.slice(1).flatMap((edge, i) => [edge, colormap[i + 2]])
    return [
      'case',
      HIGHLIGHTED,
      get(theme, 'rawColors.primary'),
      ['step', SEGMENT_MPH, colormap[1], ...steps],
    ] as ExpressionSpecification
  }, [colormap, theme])

  const hasPoint = relevantSids !== null

  const opacityExpression: ExpressionSpecification = useMemo(
    () => [
      'case',
      HIGHLIGHTED,
      ['case', WEAK, 0.45, 1],
      [
        '*',
        hasPoint ? ['case', RELEVANT, 0.95, 0.12] : 0.75,
        ['case', WEAK, 0.4, 1],
      ],
    ],
    [hasPoint],
  )

  useEffect(() => {
    if (!map) return
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        promoteId: 'sid',
      })
    }
    if (!map.getLayer(layerIds.line)) {
      map.addLayer(
        {
          id: layerIds.line,
          type: 'line',
          source: sourceId,
          layout: {
            visibility: 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': colorExpression,
            'line-opacity': opacityExpression,
            'line-width': WIDTH,
          },
        },
        map.getLayer(BEFORE_ID) ? BEFORE_ID : undefined,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // filled once the tracks load; a failed load is tried again whenever the
  // layer shows or a lookup finishes, until one succeeds
  const tracksMapRef = useRef<typeof map>(null)
  useEffect(() => {
    if (!map || !active || tracksMapRef.current === map) return
    let cancelled = false
    loadStormTracks()
      .then((data) => {
        const source = map.getSource(sourceId)
        if (cancelled || source?.type !== 'geojson') return
        ;(source as GeoJSONSource).setData(data)
        tracksMapRef.current = map
      })
      .catch((error) => console.error('Storm tracks failed:', error))
    return () => {
      cancelled = true
    }
  }, [map, active, historicEvents])

  useEffect(() => {
    if (!map?.getLayer(layerIds.line)) return
    map.setLayoutProperty(
      layerIds.line,
      'visibility',
      active ? 'visible' : 'none',
    )
  }, [map, active])

  useEffect(() => {
    if (!map?.getLayer(layerIds.line)) return
    map.setPaintProperty(layerIds.line, 'line-color', colorExpression)
    map.setPaintProperty(layerIds.line, 'line-opacity', opacityExpression)
  }, [map, colorExpression, opacityExpression])

  useEffect(() => {
    if (!map || !active || !relevantSids) return
    const handleMove = (e: MapMouseEvent) => {
      const { x, y } = e.point
      const features = map.queryRenderedFeatures(
        [
          [x - HIT_TOLERANCE, y - HIT_TOLERANCE],
          [x + HIT_TOLERANCE, y + HIT_TOLERANCE],
        ],
        { layers: [layerIds.line] },
      )
      const hit = features.find((feature) =>
        relevantSids.includes(String(feature.id)),
      )
      const sid = hit ? String(hit.id) : null
      map.getCanvas().style.cursor = sid ? 'pointer' : ''
      if (sid !== useStore.getState().hoveredEventId) setHoveredEventId(sid)
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
  }, [map, active, relevantSids, setHoveredEventId])

  useEffect(() => {
    if (!map?.getSource(sourceId)) return
    map.removeFeatureState({ source: sourceId })
    if (!active) return
    // both flags on every storm: maplibre keeps the old state of the first
    // feature set after a source-wide removal
    const highlighted = new Set([hoveredEventId, selectedStormId])
    relevantSids?.forEach((sid) =>
      map.setFeatureState(
        { source: sourceId, id: sid },
        { relevant: true, highlighted: highlighted.has(sid) },
      ),
    )
  }, [map, active, relevantSids, hoveredEventId, selectedStormId])

  return null
}

export default StormTracks
