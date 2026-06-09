export const BASE_PATH = '/research/climate-risk'

export const DATA_VERSION = 'v1.1.0'

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
    // MTBS historic burned-area boundaries (1984-present). Currently a
    // scratch location; move under the production prefix when finalized.
    historicFires:
      process.env.NEXT_PUBLIC_HISTORIC_FIRES_URL ??
      'https://carbonplan-scratch.s3.us-west-2.amazonaws.com/ocr-explore/mtbs_perims.pmtiles',
  },
  raster:
    process.env.NEXT_PUBLIC_RISK_ZARR_URL ??
    `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/pyramid/production/${DATA_VERSION}/pyramid.zarr`,
  parquetBase:
    process.env.NEXT_PUBLIC_GEOPARQUET_URL ??
    `https://carbonplan-ocr.s3.us-west-2.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/geoparquet/buildings.parquet`,
}

export const LICENSE_INFO = {
  provider: 'CarbonPlan',
  termsOfAccess:
    'https://docs.carbonplan.org/ocr/en/latest/terms-of-data-access.html',
  dataSources:
    'https://docs.carbonplan.org/ocr/en/latest/reference/data-sources.html',
  licenseName: 'ODBL',
  licenseUrl: 'https://opendatacommons.org/licenses/odbl/',
  notice:
    'Contains information from the Overture Maps Foundation database, which is made available here under the Open Database License (ODbL), a copy of which is available at https://opendatacommons.org/licenses/odbl/1-0/.',
}

export const LAYERS = {
  regions: {
    sourceId: 'regions',
  },
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
  historicFires: {
    layerName: 'mtbs_perims',
    sourceId: 'historicFires',
    layerIds: {
      fill: 'historic-fires-fill',
      line: 'historic-fires-line',
      highlight: 'historic-fires-highlight',
    },
  },
} as const

export const BUILDING_ATTRIBUTE_KEYS = {
  rps_2011: '0', // strings for map expressions
  rps_2047: '1',
  bp_2011: '2',
  bp_2047: '3',
  crps_scott: '4',
  bp_2011_riley: '5',
  bp_2047_riley: '6',
} as const

export const GEOGRAPHY_ATTRIBUTE_KEYS = {
  building_count: '0',
  mean_rps_2011: '1',
  mean_rps_2047: '2',
  rps_2011_median: '3',
  rps_2047_median: '4',
  risk_score_2011_hist: '5',
  risk_score_2047_hist: '6',
  geoid: '7',
  bbox: '8',
  name: '9',
} as const

export const STATISTICS_PATHS = {
  county: 'counties',
  censusTract: 'tracts',
  censusBlock: 'block',
  state: 'states',
  nation: 'nation',
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
