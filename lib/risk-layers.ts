// separated risk layer source and layer creation so that requests
// for these important layers go out before eg hillshade tile
// requests during app start

import {
  LayerSpecification,
  SourceSpecification,
  ExpressionSpecification,
} from 'maplibre-gl'
import { DATA_URLS, LAYERS, GEOGRAPHY_ATTRIBUTE_KEYS } from '@/lib/config'

export const getRiskSources = (): Record<string, SourceSpecification> => ({
  [LAYERS.buildings.sourceId]: {
    type: 'vector',
    url: `pmtiles://${DATA_URLS.vector.buildings}`,
    minzoom: 6,
  },
  [LAYERS.buildingPoints.sourceId]: {
    type: 'vector',
    url: `pmtiles://${DATA_URLS.vector.buildingPoints}`,
  },
  regions: {
    type: 'vector',
    url: `pmtiles://${DATA_URLS.vector.regions}`,
    promoteId: GEOGRAPHY_ATTRIBUTE_KEYS.geoid,
  },
})

const createGeographyFillLayer = (config: {
  layerName: string
  sourceId: string
  layerIds: { fill: string; line: string }
}): LayerSpecification => ({
  id: config.layerIds.fill,
  type: 'fill',
  source: config.sourceId,
  'source-layer': config.layerName,
  paint: {
    'fill-color': 'transparent',
    'fill-opacity': 0,
  },
})

const createGeographyLineLayers = (config: {
  layerName: string
  sourceId: string
  layerIds: { fill: string; line: string }
}): LayerSpecification[] => [
  {
    id: config.layerIds.line,
    type: 'line',
    source: config.sourceId,
    'source-layer': config.layerName,
    paint: {
      'line-opacity': 0,
      'line-color': 'transparent',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        2,
        0.1,
        14,
        0.5,
      ] as ExpressionSpecification,
    },
  },
  {
    id: `${config.layerIds.line}-highlight`,
    type: 'line',
    source: config.sourceId,
    'source-layer': config.layerName,
    paint: {
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        1,
        0,
      ] as ExpressionSpecification,
      'line-color': 'transparent',
      'line-width': 1,
    },
  },
]

export const getGeographyFillLayers = (): LayerSpecification[] => [
  createGeographyFillLayer(LAYERS.counties),
  createGeographyFillLayer(LAYERS.censusTracts),
  createGeographyFillLayer(LAYERS.censusBlocks),
  createGeographyFillLayer(LAYERS.states),
  createGeographyFillLayer(LAYERS.nation),
]

export const getGeographyLineLayers = (): LayerSpecification[] => [
  ...createGeographyLineLayers(LAYERS.counties),
  ...createGeographyLineLayers(LAYERS.censusTracts),
  ...createGeographyLineLayers(LAYERS.censusBlocks),
  ...createGeographyLineLayers(LAYERS.states),
  ...createGeographyLineLayers(LAYERS.nation),
]

export const getBuildingLayers = (): LayerSpecification[] => [
  {
    id: LAYERS.buildingPoints.layerIds.circle,
    type: 'circle',
    source: LAYERS.buildingPoints.sourceId,
    'source-layer': LAYERS.buildingPoints.layerName,
    paint: {
      'circle-color': 'transparent',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        1,
        13,
        2,
      ] as ExpressionSpecification,
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14,
        1,
        14.5,
        0,
      ] as ExpressionSpecification,
    },
  },
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
  let layers = insertBefore(baseLayers, getGeographyFillLayers(), 'landcover')
  layers = insertBefore(layers, getGeographyLineLayers(), 'address_label')
  layers = insertBefore(layers, getBuildingLayers(), 'buildings')
  return layers
}
