import { useEffect, useMemo, useRef } from 'react'
import { ExpressionSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { HISTORIC_STORMS_LAYER_ID, MPH_PER_KT } from '@/lib/historic-events'

const { sourceId, layerName, layerIds } = LAYERS.stormTracks
const BEFORE_ID = 'address_label'

const BINS =
  getMapLayer(RISKS.wind, HISTORIC_STORMS_LAYER_ID)?.binBoundaries ?? []
const HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
]

// Track segments colored by their recorded wind on the same Saffir-Simpson
// scale as the peak winds layer, with the storms that reached the selected
// point drawn over the rest.
const StormTracks = () => {
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'wind' &&
      state.mapLayer === HISTORIC_STORMS_LAYER_ID,
  )
  const historicEvents = useStore((state) => state.historicEvents)
  const hoveredEventId = useStore((state) => state.hoveredEventId)
  const previousHoverRef = useRef<string | null>(null)

  const colormap = useColormap({ count: BINS.length })

  const relevantSids = useMemo(
    () =>
      historicEvents.status === 'success' && historicEvents.kind === 'storms'
        ? historicEvents.events.map((storm) => storm.sid)
        : null,
    [historicEvents],
  )

  const colorExpression: ExpressionSpecification = useMemo(() => {
    const mph: ExpressionSpecification = [
      '*',
      ['to-number', ['get', 'USA_WIND']],
      MPH_PER_KT,
    ]
    const steps = BINS.slice(1).flatMap((edge, i) => [edge, colormap[i + 2]])
    return ['step', mph, colormap[1], ...steps] as ExpressionSpecification
  }, [colormap])

  const opacityExpression: ExpressionSpecification = useMemo(() => {
    const base: ExpressionSpecification | number = relevantSids
      ? ['case', ['in', ['get', 'SID'], ['literal', relevantSids]], 0.95, 0.12]
      : 0.75
    return ['case', HOVERED, 1, base]
  }, [relevantSids])

  const widthExpression: ExpressionSpecification = useMemo(() => {
    const width = (base: number): ExpressionSpecification => [
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

export default StormTracks
