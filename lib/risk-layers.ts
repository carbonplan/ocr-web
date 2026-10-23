// separated risk layer source and layer creation so that requests
// for these important layers go out before eg hillshade tile
// requests during app start

import {
  LayerSpecification,
  SourceSpecification,
  ExpressionSpecification,
} from 'maplibre-gl'
import { tileUrl } from 'geoparquet-lod/maplibre'
import { DATA_URLS, LAYERS, BUILDING_TILE_PROPERTIES } from '@/lib/config'

export const getRiskSources = (): Record<string, SourceSpecification> => ({
  [LAYERS.buildings.sourceId]: {
    type: 'vector',
    tiles: [
      tileUrl({
        url: DATA_URLS.vector.buildings,
        layer: LAYERS.buildings.layerName,
        properties: BUILDING_TILE_PROPERTIES,
      }),
    ],
  },
  [LAYERS.regionHighlight.sourceId]: {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  },
})

export const getRegionHighlightLayers = (): LayerSpecification[] => [
  {
    id: LAYERS.regionHighlight.layerIds.line,
    type: 'line',
    source: LAYERS.regionHighlight.sourceId,
    paint: {
      'line-color': 'transparent',
      'line-width': 1,
    },
  },
]

export const getBuildingLayers = (): LayerSpecification[] => [
  {
    id: LAYERS.buildings.layerIds.fill,
    type: 'fill',
    source: LAYERS.buildings.sourceId,
    'source-layer': LAYERS.buildings.layerName,
    paint: {
      'fill-color': 'transparent',
    },
  },
  {
    id: LAYERS.buildings.layerIds.line,
    type: 'line',
    source: LAYERS.buildings.sourceId,
    'source-layer': LAYERS.buildings.layerName,
    paint: {
      'line-color': 'transparent',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12,
        [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          2,
          ['boolean', ['feature-state', 'hovered'], false],
          1,
          0,
        ],
        14,
        [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          2,
          ['boolean', ['feature-state', 'hovered'], false],
          1,
          0.3,
        ],
      ] as ExpressionSpecification,
    },
  },
]

const insertBefore = (
  layers: LayerSpecification[],
  layersToInsert: LayerSpecification[],
  beforeId: string,
): LayerSpecification[] => {
  const index = layers.findIndex((layer) => layer.id === beforeId)
  if (index >= 0) {
    return [
      ...layers.slice(0, index),
      ...layersToInsert,
      ...layers.slice(index),
    ]
  }
  return [...layers, ...layersToInsert]
}

export const insertRiskLayers = (
  baseLayers: LayerSpecification[],
): LayerSpecification[] => {
  let layers = insertBefore(
    baseLayers,
    getRegionHighlightLayers(),
    'address_label',
  )
  layers = insertBefore(layers, getBuildingLayers(), 'buildings')
  return layers
}
