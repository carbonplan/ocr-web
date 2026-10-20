import { useEffect, useMemo } from 'react'
import { ExpressionSpecification } from 'maplibre-gl'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'
import type { FloodEvent } from '@/lib/historic-events/flood-history'
import { useFloodHighlights } from '@/hooks/useFloodHighlights'
import { yearColorExpression } from './flood-reports'

const { sourceId, layerName, layerIds } = LAYERS.floodSatellite
const BEFORE_ID = LAYERS.buildingPoints.layerIds.circle

const BINS =
  getMapLayer(RISKS.flood, HISTORIC_FLOODS_LAYER_ID)?.binBoundaries ?? []
const HOVERED: ExpressionSpecification = [
  'boolean',
  ['feature-state', 'hover'],
  false,
]
// the hovered event gets its own layer above every event, so overlapping
// events never cover it
const HOVER_OPACITY: ExpressionSpecification = ['case', HOVERED, 0.85, 0]

const satelliteIds = (event: FloodEvent) => event.satellite.map((s) => s.id)

// Global Flood Database water mapped from MODIS, one fill per event colored
// by year, with the events reaching the selected point drawn over the rest.
const FloodSatellite = () => {
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'flood' &&
      state.mapLayer === HISTORIC_FLOODS_LAYER_ID &&
      state.floodSource === 'satellite',
  )
  const relevantIds = useFloodHighlights(
    map,
    LAYERS.floodSatellite,
    satelliteIds,
    active,
  )
  const colormap = useColormap({ count: BINS.length })
  const colorExpression = useMemo(
    () => yearColorExpression(BINS, colormap),
    [colormap],
  )
  const fillOpacity: ExpressionSpecification | number = useMemo(
    () =>
      relevantIds
        ? [
            'case',
            ['in', ['get', 'dfo_id'], ['literal', relevantIds]],
            0.75,
            0.12,
          ]
        : 0.5,
    [relevantIds],
  )

  useEffect(() => {
    if (!map) return
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'vector',
        url: `pmtiles://${HISTORIC_URLS.floodSatellite}`,
        promoteId: 'dfo_id',
      })
    }
    const before = map.getLayer(BEFORE_ID) ? BEFORE_ID : undefined
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
        before,
      )
    }
    if (!map.getLayer(layerIds.hover)) {
      map.addLayer(
        {
          id: layerIds.hover,
          type: 'fill',
          source: sourceId,
          'source-layer': layerName,
          layout: { visibility: 'none' },
          paint: { 'fill-color': '#ffffff', 'fill-opacity': HOVER_OPACITY },
        },
        before,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    if (!map?.getLayer(layerIds.fill)) return
    const visibility = active ? 'visible' : 'none'
    map.setLayoutProperty(layerIds.fill, 'visibility', visibility)
    map.setLayoutProperty(layerIds.hover, 'visibility', visibility)
  }, [map, active])

  useEffect(() => {
    if (!map?.getLayer(layerIds.fill)) return
    map.setPaintProperty(layerIds.fill, 'fill-color', colorExpression)
    map.setPaintProperty(layerIds.fill, 'fill-opacity', fillOpacity)
  }, [map, colorExpression, fillOpacity])

  return null
}

export default FloodSatellite
