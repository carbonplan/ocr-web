import { useCallback, useEffect, useRef } from 'react'
import { useThemeUI, get } from 'theme-ui'
import { ExpressionSpecification, MapMouseEvent } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { DATA_URLS, LAYERS } from '@/lib/config'
import { FireProperties } from '@/types/location'
import {
  FIRE_MIN_YEAR,
  FIRE_MAX_YEAR,
  fireFillColorExpression,
  fireFillOpacityExpression,
  fireHighlightOpacityExpression,
  fireLineOpacityExpression,
  fireYearSortKey,
  sortFiresByRecency,
} from '@/lib/historic-utils'

const { sourceId, layerName, layerIds } = LAYERS.historicFires

// Base outline width scales with zoom; the selection highlight (a separate
// layer, drawn on top) is wider so it reads clearly.
const lineWidthExpression: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  2,
  0.4,
  11,
  1.2,
] as ExpressionSpecification

const highlightWidthExpression: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  2,
  1.5,
  11,
  3,
] as ExpressionSpecification

// MTBS burned-area boundaries (per-fire polygons, 1984-present). Polygons are
// styled by recency (recent = hotter/more opaque) and are only interactive while
// the Climate filter is set to "Historic".
const HistoricFires = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const historicMode = useStore((state) => state.historicMode)
  const selectedFires = useStore((state) => state.selectedFires)
  const setSelectedFires = useStore((state) => state.setSelectedFires)
  const fireStartYear = useStore((state) => state.fireStartYear)
  const previousSelectedIds = useRef<string[]>([])
  // Latest cutoff year, read inside event handlers without re-subscribing them.
  const startYearRef = useRef(fireStartYear)
  startYearRef.current = fireStartYear

  useEffect(() => {
    if (!map) return

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        url: `pmtiles://${DATA_URLS.vector.historicFires}`,
        maxzoom: 11,
        promoteId: 'event_id',
        attribution:
          '<a href="https://www.mtbs.gov/" target="_blank" rel="noreferrer">MTBS</a> (USGS/USFS)',
      })
    }

    if (!map.getLayer(layerIds.fill)) {
      map.addLayer({
        id: layerIds.fill,
        type: 'fill',
        source: sourceId,
        'source-layer': layerName,
        // Most recent fires draw on top of older overlapping ones.
        layout: { visibility: 'none', 'fill-sort-key': fireYearSortKey },
        paint: {
          'fill-color': '#eb5429',
          'fill-opacity': fireFillOpacityExpression(FIRE_MIN_YEAR),
        },
      })
    }

    if (!map.getLayer(layerIds.line)) {
      map.addLayer({
        id: layerIds.line,
        type: 'line',
        source: sourceId,
        'source-layer': layerName,
        layout: { visibility: 'none', 'line-sort-key': fireYearSortKey },
        paint: {
          'line-color': '#eb5429',
          'line-width': lineWidthExpression,
          'line-opacity': fireLineOpacityExpression(FIRE_MIN_YEAR),
        },
      })
    }

    // Selection highlight, drawn on top of the fills and base outlines.
    if (!map.getLayer(layerIds.highlight)) {
      map.addLayer({
        id: layerIds.highlight,
        type: 'line',
        source: sourceId,
        'source-layer': layerName,
        layout: {
          visibility: 'none',
          'line-sort-key': fireYearSortKey,
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#eb5429',
          'line-width': highlightWidthExpression,
          'line-opacity': fireHighlightOpacityExpression(FIRE_MIN_YEAR),
        },
      })
    }

    return () => {
      if (!map.getStyle()) return
      if (map.getLayer(layerIds.highlight)) map.removeLayer(layerIds.highlight)
      if (map.getLayer(layerIds.line)) map.removeLayer(layerIds.line)
      if (map.getLayer(layerIds.fill)) map.removeLayer(layerIds.fill)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
  }, [map])

  // Fills use an opaque recency color ramp (recency baked into color so stacked
  // fires don't accumulate alpha); the base outline stays a single red and the
  // selection highlight uses the theme primary color. All track the theme.
  useEffect(() => {
    if (!map) return
    const fireColor = get(theme, 'rawColors.red')
    if (map.getLayer(layerIds.fill)) {
      map.setPaintProperty(
        layerIds.fill,
        'fill-color',
        fireFillColorExpression(theme),
      )
    }
    if (map.getLayer(layerIds.line)) {
      map.setPaintProperty(layerIds.line, 'line-color', fireColor)
    }
    if (map.getLayer(layerIds.highlight)) {
      map.setPaintProperty(
        layerIds.highlight,
        'line-color',
        get(theme, 'rawColors.primary'),
      )
    }
  }, [map, theme])

  // Hide fires before the cutoff year via paint opacity (a per-feature
  // re-evaluation) rather than map.setFilter, which re-buckets every feature.
  useEffect(() => {
    if (!map) return
    if (map.getLayer(layerIds.fill)) {
      map.setPaintProperty(
        layerIds.fill,
        'fill-opacity',
        fireFillOpacityExpression(fireStartYear),
      )
    }
    if (map.getLayer(layerIds.line)) {
      map.setPaintProperty(
        layerIds.line,
        'line-opacity',
        fireLineOpacityExpression(fireStartYear),
      )
    }
    if (map.getLayer(layerIds.highlight)) {
      map.setPaintProperty(
        layerIds.highlight,
        'line-opacity',
        fireHighlightOpacityExpression(fireStartYear),
      )
    }
  }, [map, fireStartYear])

  // Show the layers only in historic mode.
  useEffect(() => {
    if (!map) return
    const visibility = historicMode ? 'visible' : 'none'
    if (map.getLayer(layerIds.fill))
      map.setLayoutProperty(layerIds.fill, 'visibility', visibility)
    if (map.getLayer(layerIds.line))
      map.setLayoutProperty(layerIds.line, 'visibility', visibility)
    if (map.getLayer(layerIds.highlight))
      map.setLayoutProperty(layerIds.highlight, 'visibility', visibility)
  }, [map, historicMode])

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      if (!map) return
      const features = map.queryRenderedFeatures(e.point, {
        layers: [layerIds.fill],
      })
      // Dedupe overlapping fires (a location can burn multiple times), ignoring
      // any before the cutoff year (those are rendered transparent but still
      // present in the tiles).
      const startYear = startYearRef.current
      const byId = new Map<string, FireProperties>()
      for (const feature of features) {
        const props = feature.properties as FireProperties
        if (
          props?.event_id &&
          props.year >= startYear &&
          props.year <= FIRE_MAX_YEAR &&
          !byId.has(props.event_id)
        ) {
          byId.set(props.event_id, props)
        }
      }
      if (byId.size === 0) {
        setSelectedFires(null)
        return
      }
      setSelectedFires(sortFiresByRecency(Array.from(byId.values())))
    },
    [map, setSelectedFires],
  )

  const handleEnter = useCallback(() => {
    if (map) map.getCanvas().style.cursor = 'pointer'
  }, [map])

  const handleLeave = useCallback(() => {
    if (map) map.getCanvas().style.cursor = ''
  }, [map])

  // Selection + hover interactions are only active in historic mode.
  useEffect(() => {
    if (!map || !historicMode) return
    map.on('click', handleClick)
    map.on('mouseenter', layerIds.fill, handleEnter)
    map.on('mouseleave', layerIds.fill, handleLeave)
    return () => {
      map.off('click', handleClick)
      map.off('mouseenter', layerIds.fill, handleEnter)
      map.off('mouseleave', layerIds.fill, handleLeave)
    }
  }, [map, historicMode, handleClick, handleEnter, handleLeave])

  // Reflect the current selection onto the map via feature-state.
  useEffect(() => {
    if (!map || !map.getSource(sourceId)) return
    previousSelectedIds.current.forEach((id) =>
      map.setFeatureState(
        { source: sourceId, sourceLayer: layerName, id },
        { selected: false },
      ),
    )
    const ids = (selectedFires ?? []).map((fire) => fire.event_id)
    ids.forEach((id) =>
      map.setFeatureState(
        { source: sourceId, sourceLayer: layerName, id },
        { selected: true },
      ),
    )
    previousSelectedIds.current = ids
  }, [map, selectedFires])

  return null
}

export default HistoricFires
