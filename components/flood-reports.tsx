import { useEffect, useMemo } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'
import type { FloodEvent } from '@/lib/historic-events/flood-history'
import { useFloodHighlights } from '@/hooks/useFloodHighlights'

const { sourceId, layerName, layerIds } = LAYERS.floodReports
const FILL_BEFORE_ID = LAYERS.buildingPoints.layerIds.circle
const LINE_BEFORE_ID = 'address_label'

const BINS =
  getMapLayer(RISKS.flood, HISTORIC_FLOODS_LAYER_ID)?.binBoundaries ?? []
const HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
]
const POLYGONS: FilterSpecification = ['==', ['geometry-type'], 'Polygon']
const OUTLINES: FilterSpecification = [
  'in',
  ['geometry-type'],
  ['literal', ['Polygon', 'LineString']],
]
const POINTS: FilterSpecification = ['==', ['geometry-type'], 'Point']
// boxes bound the reported area rather than map the water, so they are
// outlined and only filled while hovered
const BOX_FILL_OPACITY: ExpressionSpecification = ['case', HOVERED, 0.3, 0]

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

// NWS flood reports, each the box between its reported corners, a line when
// the box is a sliver, or a point, colored by year, with the ones near the
// selected point drawn over the rest.
const FloodReports = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'flood' &&
      state.mapLayer === HISTORIC_FLOODS_LAYER_ID &&
      state.floodSource === 'noaa',
  )
  const relevantIds = useFloodHighlights(
    map,
    LAYERS.floodReports,
    reportIds,
    active,
  )

  const colormap = useColormap({ count: BINS.length })

  const colorExpression = useMemo(
    () => yearColorExpression(BINS, colormap),
    [colormap],
  )

  const isRelevant: ExpressionSpecification | null = useMemo(
    () =>
      relevantIds
        ? ['in', ['get', 'event_id'], ['literal', relevantIds]]
        : null,
    [relevantIds],
  )

  const pointOpacity: ExpressionSpecification = useMemo(
    () => [
      'case',
      HOVERED,
      0.85,
      isRelevant ? ['case', isRelevant, 0.7, 0.1] : 0.4,
    ],
    [isRelevant],
  )

  const strokeOpacity: ExpressionSpecification = useMemo(
    () => [
      'case',
      HOVERED,
      1,
      isRelevant ? ['case', isRelevant, 1, 0.25] : 0.8,
    ],
    [isRelevant],
  )

  const highlightColor = useMemo(
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
        url: `pmtiles://${HISTORIC_URLS.floodReports}`,
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
          filter: POLYGONS,
          layout: { visibility: 'none' },
          paint: {
            'fill-color': colorExpression,
            'fill-opacity': BOX_FILL_OPACITY,
          },
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
          filter: OUTLINES,
          layout: { visibility: 'none' },
          paint: {
            'line-color': highlightColor,
            'line-opacity': strokeOpacity,
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
    if (!map.getLayer(layerIds.circle)) {
      map.addLayer(
        {
          id: layerIds.circle,
          type: 'circle',
          source: sourceId,
          'source-layer': layerName,
          filter: POINTS,
          layout: { visibility: 'none' },
          paint: {
            'circle-color': colorExpression,
            'circle-opacity': pointOpacity,
            'circle-stroke-color': highlightColor,
            'circle-stroke-opacity': strokeOpacity,
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
    map.setLayoutProperty(layerIds.circle, 'visibility', visibility)
  }, [map, active])

  useEffect(() => {
    if (!map?.getLayer(layerIds.fill)) return
    map.setPaintProperty(layerIds.fill, 'fill-color', colorExpression)
    map.setPaintProperty(layerIds.line, 'line-color', highlightColor)
    map.setPaintProperty(layerIds.line, 'line-opacity', strokeOpacity)
    map.setPaintProperty(layerIds.circle, 'circle-color', colorExpression)
    map.setPaintProperty(layerIds.circle, 'circle-opacity', pointOpacity)
    map.setPaintProperty(layerIds.circle, 'circle-stroke-color', highlightColor)
    map.setPaintProperty(
      layerIds.circle,
      'circle-stroke-opacity',
      strokeOpacity,
    )
  }, [map, colorExpression, pointOpacity, highlightColor, strokeOpacity])

  return null
}

export default FloodReports
