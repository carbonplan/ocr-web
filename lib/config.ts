export const DATA_VERSION = 'v0.13.2'

export const DATA_URLS = {
  vector: {
    buildings:
      process.env.NEXT_PUBLIC_BUILDING_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/pmtiles/buildings.pmtiles`,
    regions:
      process.env.NEXT_PUBLIC_REGIONS_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/pmtiles/regions.pmtiles`,
    buildingPoints:
      process.env.NEXT_PUBLIC_BUILDING_POINTS_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/pmtiles/building_centroids.pmtiles`,
  },
  raster:
    process.env.NEXT_PUBLIC_RISK_ZARR_URL ??
    `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/pyramid/production/${DATA_VERSION}/pyramid.zarr`,
  downloads: `https://wywisai6r4dyxoib6aq2j2ewiy0sdsdg.lambda-url.us-west-2.on.aws/export`,
}

export const LAYERS = {
  buildings: {
    layerName: 'risk',
    sourceId: 'buildings',
    layerIds: {
      fill: 'risk-buildings-fill',
      line: 'risk-buildings-line',
    },
  },
  counties: {
    layerName: 'counties',
    sourceId: 'regions',
    layerIds: {
      fill: 'risk-counties-fill',
      line: 'risk-counties-line',
    },
  },
  censusTracts: {
    layerName: 'tracts',
    sourceId: 'regions',
    layerIds: {
      fill: 'risk-census-tracts-fill',
      line: 'risk-census-tracts-line',
    },
  },
  censusBlocks: {
    layerName: 'blocks',
    sourceId: 'regions',
    layerIds: {
      fill: 'risk-census-blocks-fill',
      line: 'risk-census-blocks-line',
    },
  },
  states: {
    layerName: 'states',
    sourceId: 'regions',
    layerIds: {
      fill: 'risk-states-fill',
      line: 'risk-states-line',
    },
  },
  nation: {
    layerName: 'nation',
    sourceId: 'regions',
    layerIds: {
      fill: 'risk-nation-fill',
      line: 'risk-nation-line',
    },
  },
  buildingPoints: {
    layerName: 'risk',
    sourceId: 'buildingPoints',
    layerIds: {
      circle: 'building-points-circle',
    },
  },
} as const

export const BUILDING_ATTRIBUTE_KEYS = {
  rps_2011: '0', // strings for map expressions
  rps_2047: '1',
  burn_probability_2011: '2',
  burn_probability_2047: '3',
  conditional_risk_usfs: '4',
  burn_probability_usfs_2011: '5',
  burn_probability_usfs_2047: '6',
} as const

export const GEOGRAPHY_ATTRIBUTE_KEYS = {
  building_count: '0',
  mean_rps_2011: '1',
  mean_rps_2047: '2',
  median_rps_2011: '3',
  median_rps_2047: '4',
  rps_2011: '5',
  rps_2047: '6',
  geoid: '7',
  bbox: '8',
  name: '9',
} as const

export const RISKS = {
  fire: {
    colormap: 'reds',
    binBoundaries: [0, 0.01, 0.02, 0.035, 0.06, 0.1, 0.2, 0.5, 1, 3],
  },
} as const

export const RASTER_ZOOM_THRESHOLD = 14

export const GEOGRAPHY_MIN_ZOOM = {
  nation: 0,
  state: 5,
  county: 6,
  censusTract: 7,
  censusBlock: 9,
} as const
