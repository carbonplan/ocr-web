import { useEffect, useMemo, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { HISTORIC_FIRES_LAYER_ID } from '@/lib/historic-events'

const { sourceId, layerName, layerIds } = LAYERS.firePerimeters
const FILL_BEFORE_ID = LAYERS.buildingPoints.layerIds.circle
const LINE_BEFORE_ID = 'address_label'

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
  const previousHoverRef = useRef<string | null>(null)

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
      relevantIds
        ? ['in', ['get', 'event_id'], ['literal', relevantIds]]
        : null,
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
        url: `pmtiles://${HISTORIC_URLS.firePerimeters}`,
        promoteId: 'event_id',
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

  return null
}

export default FirePerimeters
