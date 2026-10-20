import { useEffect, useMemo } from 'react'
import { get, useThemeUI } from 'theme-ui'
import { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'
import type { FloodEvent } from '@/lib/historic-events/flood-history'
import { NEWS_MAX_KM2 } from '@/lib/historic-events/flood-news'
import { useFloodHighlights } from '@/hooks/useFloodHighlights'
import { yearColorExpression } from './flood-reports'

const { sourceId, layerName, layerIds } = LAYERS.floodNews
const BEFORE_ID = 'address_label'

const BINS =
  getMapLayer(RISKS.flood, HISTORIC_FLOODS_LAYER_ID)?.binBoundaries ?? []
const HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
]
const SMALL: FilterSpecification = ['<', ['get', 'area_km2'], NEWS_MAX_KM2]

const newsIds = (event: FloodEvent) => event.news.map((n) => n.id)

// Groundsource news records with street- or neighborhood-sized places, as
// points at each place's center, colored by year.
const FloodNews = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'flood' &&
      state.mapLayer === HISTORIC_FLOODS_LAYER_ID &&
      state.floodSource === 'news',
  )
  const relevantIds = useFloodHighlights(map, LAYERS.floodNews, newsIds, active)
  const colormap = useColormap({ count: BINS.length })
  const colorExpression = useMemo(
    () => yearColorExpression(BINS, colormap),
    [colormap],
  )
  const opacity: ExpressionSpecification = useMemo(
    () => [
      'case',
      HOVERED,
      1,
      relevantIds
        ? ['case', ['in', ['get', 'uuid'], ['literal', relevantIds]], 0.9, 0.12]
        : 0.6,
    ],
    [relevantIds],
  )
  const strokeColor = useMemo(
    () => get(theme, 'rawColors.primary') as string,
    [theme],
  )

  useEffect(() => {
    if (!map) return
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        url: `pmtiles://${HISTORIC_URLS.floodNews}`,
        promoteId: 'uuid',
      })
    }
    if (!map.getLayer(layerIds.circle)) {
      map.addLayer(
        {
          id: layerIds.circle,
          type: 'circle',
          source: sourceId,
          'source-layer': layerName,
          filter: SMALL,
          layout: { visibility: 'none' },
          paint: {
            'circle-color': colorExpression,
            'circle-opacity': opacity,
            'circle-stroke-color': strokeColor,
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
        map.getLayer(BEFORE_ID) ? BEFORE_ID : undefined,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    if (!map?.getLayer(layerIds.circle)) return
    map.setLayoutProperty(
      layerIds.circle,
      'visibility',
      active ? 'visible' : 'none',
    )
  }, [map, active])

  useEffect(() => {
    if (!map?.getLayer(layerIds.circle)) return
    map.setPaintProperty(layerIds.circle, 'circle-color', colorExpression)
    map.setPaintProperty(layerIds.circle, 'circle-opacity', opacity)
    map.setPaintProperty(layerIds.circle, 'circle-stroke-color', strokeColor)
  }, [map, colorExpression, opacity, strokeColor])

  return null
}

export default FloodNews
