import { useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, MapMouseEvent } from 'maplibre-gl'
import { tileUrl } from 'tiled-geoparquet/tiles'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { HISTORIC_FIRES_LAYER_ID } from '@/lib/historic-events'

const { sourceId, layerName, layerIds } = LAYERS.firePerimeters
const FILL_BEFORE_ID = LAYERS.buildings.layerIds.fill
const LINE_BEFORE_ID = 'address_label'
// the file's finest overview; MapLibre overzooms past it
const MAX_ZOOM = 11

const BINS =
  getMapLayer(RISKS.fire, HISTORIC_FIRES_LAYER_ID)?.binBoundaries ?? []
const HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
]

// MTBS burn perimeters colored by ignition decade, with the ones containing
// the selected point drawn over the rest.
const FirePerimeters = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'fire' &&
      state.mapLayer === HISTORIC_FIRES_LAYER_ID,
  )
  const historicEvents = useStore((state) => state.historicEvents)
  const hoveredEventId = useStore((state) => state.hoveredEventId)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const selectedEventId = useStore((state) => state.selectedEventId)
  const previousHoverRef = useRef<string[]>([])

  const colormap = useColormap({ count: BINS.length })

  // held through 'loading' so clicking between points doesn't briefly undim
  // every perimeter
  const relevantIdsRef = useRef<string[] | null>(null)
  const relevantIds = useMemo(() => {
    if (historicEvents.status !== 'loading') {
      relevantIdsRef.current =
        historicEvents.status === 'success' && historicEvents.kind === 'fires'
          ? historicEvents.events.map((fire) => fire.id)
          : null
    }
    return relevantIdsRef.current
  }, [historicEvents])

  const colorExpression: ExpressionSpecification = useMemo(() => {
    const steps = BINS.slice(1).flatMap((edge, i) => [edge, colormap[i + 2]])
    return [
      'step',
      ['to-number', ['get', 'year']],
      colormap[1],
      ...steps,
    ] as ExpressionSpecification
  }, [colormap])

  const isRelevant: ExpressionSpecification | null = useMemo(
    () =>
      relevantIds ? ['in', ['id'], ['literal', relevantIds.map(Number)]] : null,
    [relevantIds],
  )

  const fillOpacity: ExpressionSpecification = useMemo(
    () => [
      'case',
      HOVERED,
      0.85,
      isRelevant ? ['case', isRelevant, 0.7, 0.15] : 0.45,
    ],
    [isRelevant],
  )

  const lineOpacity: ExpressionSpecification = useMemo(
    () => ['case', HOVERED, 1, isRelevant ? ['case', isRelevant, 1, 0.3] : 0.8],
    [isRelevant],
  )

  const lineColor = useMemo(
    () =>
      [
        'case',
        HOVERED,
        get(theme, 'rawColors.primary'),
        colorExpression,
      ] as ExpressionSpecification,
    [theme, colorExpression],
  )

  useEffect(() => {
    if (!map) return
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        tiles: [
          tileUrl({
            url: HISTORIC_URLS.firePerimeters,
            layer: layerName,
            properties: ['year'],
          }),
        ],
        maxzoom: MAX_ZOOM,
      })
    }
    if (!map.getLayer(layerIds.fill)) {
      map.addLayer(
        {
          id: layerIds.fill,
          type: 'fill',
          source: sourceId,
          'source-layer': layerName,
          layout: { visibility: 'none' },
          paint: { 'fill-color': colorExpression, 'fill-opacity': fillOpacity },
        },
        map.getLayer(FILL_BEFORE_ID) ? FILL_BEFORE_ID : undefined,
      )
    }
    if (!map.getLayer(layerIds.line)) {
      map.addLayer(
        {
          id: layerIds.line,
          type: 'line',
          source: sourceId,
          'source-layer': layerName,
          layout: { visibility: 'none' },
          paint: {
            'line-color': lineColor,
            'line-opacity': lineOpacity,
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              6,
              ['case', HOVERED, 1.5, 0.4],
              12,
              ['case', HOVERED, 3, 1],
            ],
          },
        },
        map.getLayer(LINE_BEFORE_ID) ? LINE_BEFORE_ID : undefined,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    if (!map?.getLayer(layerIds.fill)) return
    const visibility = active ? 'visible' : 'none'
    map.setLayoutProperty(layerIds.fill, 'visibility', visibility)
    map.setLayoutProperty(layerIds.line, 'visibility', visibility)
  }, [map, active])

  useEffect(() => {
    if (!map?.getLayer(layerIds.fill)) return
    map.setPaintProperty(layerIds.fill, 'fill-color', colorExpression)
    map.setPaintProperty(layerIds.fill, 'fill-opacity', fillOpacity)
    map.setPaintProperty(layerIds.line, 'line-color', lineColor)
    map.setPaintProperty(layerIds.line, 'line-opacity', lineOpacity)
  }, [map, colorExpression, fillOpacity, lineColor, lineOpacity])

  // hovering a perimeter that contains the selected point hovers its fire
  useEffect(() => {
    if (!map || !active || !relevantIds?.length) return
    const handleMove = (e: MapMouseEvent) => {
      if (!map.getLayer(layerIds.fill)) return
      const features = map.queryRenderedFeatures(e.point, {
        layers: [layerIds.fill],
      })
      const hit = features.find((f) => relevantIds.includes(String(f.id)))
      const id = hit ? String(hit.id) : null
      map.getCanvas().style.cursor = id ? 'pointer' : ''
      if (id !== useStore.getState().hoveredEventId) setHoveredEventId(id)
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
  }, [map, active, relevantIds, setHoveredEventId])

  // the hovered and selected fires are drawn hovered
  useEffect(() => {
    if (!map?.getSource(sourceId)) return
    const key = (id: string) => ({
      source: sourceId,
      sourceLayer: layerName,
      id: Number(id),
    })
    for (const id of previousHoverRef.current) {
      map.setFeatureState(key(id), { hover: false })
    }
    const highlighted = active
      ? [hoveredEventId, selectedEventId].filter((id): id is string => !!id)
      : []
    for (const id of highlighted) map.setFeatureState(key(id), { hover: true })
    previousHoverRef.current = highlighted
  }, [map, hoveredEventId, selectedEventId, active])

  return null
}

export default FirePerimeters
