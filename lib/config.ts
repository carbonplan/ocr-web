export const DATA_VERSION = 'v0.9.0'

export const DATA_URLS = {
  vector: {
    buildings:
      process.env.NEXT_PUBLIC_BUILDING_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/pmtiles/buildings.pmtiles`,
    regions:
      process.env.NEXT_PUBLIC_REGIONS_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/pmtiles/regions.pmtiles`,
  },
  raster: {
    png:
      process.env.NEXT_PUBLIC_RISK_RASTER_URL ??
      `https://el2xugp6jtpzbkdvfsr7bkddaa0npisd.lambda-url.us-west-2.on.aws/datasets/production-${DATA_VERSION}`,
    zarr:
      process.env.NEXT_PUBLIC_RISK_ZARR_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/pyramid/production/${DATA_VERSION}/pyramid.zarr`,
  },
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
} as const

export const BUILDING_ATTRIBUTE_KEYS = {
  wind_risk_2011: '0', // strings for map expressions
  wind_risk_2047: '1',
  burn_probability_2011: '2',
  burn_probability_2047: '3',
  conditional_risk_usfs: '4',
  burn_probability_usfs_2011: '5',
  burn_probability_usfs_2047: '6',
} as const

export const GEOGRAPHY_ATTRIBUTE_KEYS = {
  building_count: '0',
  mean_wind_risk_2011: '1',
  mean_wind_risk_2047: '2',
  median_wind_risk_2011: '3',
  median_wind_risk_2047: '4',
  wind_risk_2011: '5',
  wind_risk_2047: '6',
  geoid: '7',
  bbox: '8',
  county_name: '9',
} as const

export const RISKS = {
  fire: {
    colormap: 'fire-risk',
    bounds: {
      min: 0.01,
      max: 25,
    },
  },
} as const

export const RASTER_ZOOM_THRESHOLD = 12
