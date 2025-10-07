const DATA_VERSION = 'v0.4.0'

export const DATA_URLS = {
  vector: {
    buildings:
      process.env.NEXT_PUBLIC_BUILDING_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/pmtiles/buildings.pmtiles`,
    counties:
      process.env.NEXT_PUBLIC_COUNTY_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/pmtiles/counties.pmtiles`,
    censusTracts:
      process.env.NEXT_PUBLIC_CENSUS_TRACT_URL ??
      `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/pmtiles/tracts.pmtiles`,
  },
  raster: {
    risk:
      process.env.NEXT_PUBLIC_RISK_RASTER_URL ??
      `https://el2xugp6jtpzbkdvfsr7bkddaa0npisd.lambda-url.us-west-2.on.aws/datasets/production-${DATA_VERSION}`,
    usfsBase:
      'https://el2xugp6jtpzbkdvfsr7bkddaa0npisd.lambda-url.us-west-2.on.aws/datasets/RPS',
  },
  downloads:
    process.env.NEXT_PUBLIC_DOWNLOADS_URL ??
    `https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/vector/production/${DATA_VERSION}/per-region-analysis/`,
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
    layerName: 'risk',
    sourceId: 'counties',
    layerIds: {
      fill: 'risk-counties-fill',
      line: 'risk-counties-line',
    },
  },
  censusTracts: {
    layerName: 'risk',
    sourceId: 'census-tracts',
    layerIds: {
      fill: 'risk-census-tracts-fill',
      line: 'risk-census-tracts-line',
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
  county_name: '8',
} as const

export const RISKS = {
  fire: {
    colormap: 'fire-risk',
    binRatios: [0.1, 0.2, 0.5, 1],
    bounds: {
      min: 0.01,
      max: 25,
    },
  },
} as const
