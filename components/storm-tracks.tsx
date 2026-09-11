import { useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, MapMouseEvent } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import {
  HISTORIC_STORMS_LAYER_ID,
  MPH_PER_KT,
  TROPICAL_STORM_MPH,
} from '@/lib/historic-events'

const { sourceId, layerName, layerIds } = LAYERS.stormTracks
const BEFORE_ID = 'address_label'
// pixels around the cursor that count as hovering a track
const HIT_TOLERANCE = 6

const BINS =
  getMapLayer(RISKS.wind, HISTORIC_STORMS_LAYER_ID)?.binBoundaries ?? []
const HOVERED: ExpressionSpecification = [
  'any',
  ['boolean', ['feature-state', 'hover'], false],
  ['boolean', ['feature-state', 'selected'], false],
]
const SEGMENT_MPH: ExpressionSpecification = [
  '*',
  ['to-number', ['get', 'USA_WIND']],
  MPH_PER_KT,
]
// segments below tropical-storm strength are drawn but not modeled
const WEAK: ExpressionSpecification = ['<', SEGMENT_MPH, TROPICAL_STORM_MPH]

// Track segments colored by their recorded wind on the same Saffir-Simpson
// scale as the peak winds layer, with the storms that reached the selected
// point drawn over the rest.
const StormTracks = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'wind' &&
      state.mapLayer === HISTORIC_STORMS_LAYER_ID,
  )
  const historicEvents = useStore((state) => state.historicEvents)
  const hoveredEventId = useStore((state) => state.hoveredEventId)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const selectedStormId = useStore((state) => state.selectedStormId)
  const previousHoverRef = useRef<string | null>(null)
  const previousSelectedRef = useRef<string | null>(null)

  const colormap = useColormap({ count: BINS.length })

  const relevantSids = useMemo(
    () =>
      historicEvents.status === 'success' && historicEvents.kind === 'storms'
        ? historicEvents.events.map((storm) => storm.sid)
        : null,
    [historicEvents],
  )

  const colorExpression: ExpressionSpecification = useMemo(() => {
    const steps = BINS.slice(1).flatMap((edge, i) => [edge, colormap[i + 2]])
    return [
      'case',
      HOVERED,
      get(theme, 'rawColors.primary'),
      ['step', SEGMENT_MPH, colormap[1], ...steps],
    ] as ExpressionSpecification
  }, [colormap, theme])

  // while a storm is hovered the rest recede, so its whole track reads clearly
  const opacityExpression: ExpressionSpecification = useMemo(() => {
    const dim = hoveredEventId || selectedStormId ? 0.4 : 1
    const base: ExpressionSpecification | number = relevantSids
      ? [
          'case',
          ['in', ['get', 'SID'], ['literal', relevantSids]],
          0.95 * dim,
          0.12 * dim,
        ]
      : 0.75 * dim
    return [
      'case',
      HOVERED,
      ['case', WEAK, 0.45, 1],
      ['*', base, ['case', WEAK, 0.4, 1]],
    ]
  }, [relevantSids, hoveredEventId, selectedStormId])

  const widthExpression: ExpressionSpecification = useMemo(() => {
    const width = (base: number): ExpressionSpecification => [
      '*',
      ['case', WEAK, 0.6, 1],
      [
        'case',
        HOVERED,
        base * 2.5,
        relevantSids
          ? [
              'case',
              ['in', ['get', 'SID'], ['literal', relevantSids]],
              base * 1.5,
              base,
            ]
          : base,
      ],
    ]
    return [
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
  }, [relevantSids])

  useEffect(() => {
    if (!map) return
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        url: `pmtiles://${HISTORIC_URLS.stormTracks}`,
        promoteId: 'SID',
      })
    }
    if (!map.getLayer(layerIds.line)) {
      map.addLayer(
        {
          id: layerIds.line,
          type: 'line',
          source: sourceId,
          'source-layer': layerName,
          layout: {
            visibility: 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': colorExpression,
            'line-opacity': opacityExpression,
            'line-width': widthExpression,
          },
        },
        map.getLayer(BEFORE_ID) ? BEFORE_ID : undefined,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

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
    map.setPaintProperty(layerIds.line, 'line-width', widthExpression)
  }, [map, colorExpression, opacityExpression, widthExpression])

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
    if (previousHoverRef.current) {
      map.setFeatureState(
        {
          source: sourceId,
          sourceLayer: layerName,
          id: previousHoverRef.current,
        },
        { hover: false },
      )
    }
    if (hoveredEventId && active) {
      map.setFeatureState(
        { source: sourceId, sourceLayer: layerName, id: hoveredEventId },
        { hover: true },
      )
      previousHoverRef.current = hoveredEventId
    } else {
      previousHoverRef.current = null
    }
  }, [map, hoveredEventId, active])

  useEffect(() => {
    if (!map?.getSource(sourceId)) return
    if (previousSelectedRef.current) {
      map.setFeatureState(
        {
          source: sourceId,
          sourceLayer: layerName,
          id: previousSelectedRef.current,
        },
        { selected: false },
      )
    }
    if (selectedStormId && active) {
      map.setFeatureState(
        { source: sourceId, sourceLayer: layerName, id: selectedStormId },
        { selected: true },
      )
      previousSelectedRef.current = selectedStormId
    } else {
      previousSelectedRef.current = null
    }
  }, [map, selectedStormId, active])

  return null
}

export default StormTracks
