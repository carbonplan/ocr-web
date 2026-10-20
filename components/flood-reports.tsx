import { useEffect, useMemo } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'
import type { FloodEvent } from '@/lib/historic-events/flood-history'
import { useFloodHighlights } from '@/hooks/useFloodHighlights'

const points = LAYERS.floodReportPoints
const boxes = LAYERS.floodReports
const BEFORE_ID = 'address_label'

const BINS =
  getMapLayer(RISKS.flood, HISTORIC_FLOODS_LAYER_ID)?.binBoundaries ?? []
const HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
]
// the reported area, outlined only for the hovered event
const BOX_OPACITY: ExpressionSpecification = ['case', HOVERED, 1, 0]

// colormap[0] is the no-data swatch; years before the second bin edge take
// the first color
export const yearColorExpression = (
  bins: number[],
  colormap: string[],
): ExpressionSpecification =>
  [
    'step',
    ['to-number', ['get', 'year']],
    colormap[1],
    ...bins.slice(1).flatMap((edge, i) => [edge, colormap[i + 2]]),
  ] as ExpressionSpecification

const reportIds = (event: FloodEvent) => event.reports.map((r) => r.id)

// NWS flood reports as dots at their begin locations, colored by year, with
// the ones near the selected point drawn over the rest. Nearness is measured
// to each report's box, which is outlined while its event is hovered.
const FloodReports = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'flood' &&
      state.mapLayer === HISTORIC_FLOODS_LAYER_ID &&
      state.floodSource === 'noaa',
  )
  const relevantIds = useFloodHighlights(map, points, reportIds, active)
  useFloodHighlights(map, boxes, reportIds, active)

  const colormap = useColormap({ count: BINS.length })
  const colorExpression = useMemo(
    () => yearColorExpression(BINS, colormap),
    [colormap],
  )
  const primary = get(theme, 'rawColors.primary') as string

  const opacity: ExpressionSpecification = useMemo(
    () => [
      'case',
      HOVERED,
      1,
      relevantIds
        ? [
            'case',
            ['in', ['get', 'event_id'], ['literal', relevantIds]],
            0.9,
            0.12,
          ]
        : 0.6,
    ],
    [relevantIds],
  )

  useEffect(() => {
    if (!map) return
    const before = map.getLayer(BEFORE_ID) ? BEFORE_ID : undefined
    for (const [layer, url] of [
      [points, HISTORIC_URLS.floodReportPoints],
      [boxes, HISTORIC_URLS.floodReports],
    ] as const) {
      if (!map.getSource(layer.sourceId)) {
        map.addSource(layer.sourceId, {
          type: 'vector',
          url: `pmtiles://${url}`,
          promoteId: 'event_id',
        })
      }
    }
    if (!map.getLayer(boxes.layerIds.line)) {
      map.addLayer(
        {
          id: boxes.layerIds.line,
          type: 'line',
          source: boxes.sourceId,
          'source-layer': boxes.layerName,
          layout: { visibility: 'none' },
          paint: {
            'line-color': primary,
            'line-opacity': BOX_OPACITY,
            'line-width': 2,
          },
        },
        before,
      )
    }
    if (!map.getLayer(points.layerIds.circle)) {
      map.addLayer(
        {
          id: points.layerIds.circle,
          type: 'circle',
          source: points.sourceId,
          'source-layer': points.layerName,
          layout: { visibility: 'none' },
          paint: {
            'circle-color': colorExpression,
            'circle-opacity': opacity,
            'circle-stroke-color': primary,
            'circle-stroke-width': ['case', HOVERED, 2, 0],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4,
              1.5,
              12,
              ['case', HOVERED, 8, 5],
            ],
          },
        },
        before,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    if (!map?.getLayer(points.layerIds.circle)) return
    const visibility = active ? 'visible' : 'none'
    map.setLayoutProperty(points.layerIds.circle, 'visibility', visibility)
    map.setLayoutProperty(boxes.layerIds.line, 'visibility', visibility)
  }, [map, active])

  useEffect(() => {
    if (!map?.getLayer(points.layerIds.circle)) return
    map.setPaintProperty(
      points.layerIds.circle,
      'circle-color',
      colorExpression,
    )
    map.setPaintProperty(points.layerIds.circle, 'circle-opacity', opacity)
    map.setPaintProperty(points.layerIds.circle, 'circle-stroke-color', primary)
    map.setPaintProperty(boxes.layerIds.line, 'line-color', primary)
  }, [map, colorExpression, opacity, primary])

  return null
}

export default FloodReports
