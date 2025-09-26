import { FireRisk } from '@/types/location'

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

const FIRE_ATTRIBUTES: FireRisk<string> = {
  baseRisk: {
    current: 'USFS_RPS',
    future: 'USFS_RPS',
  },
  windRisk: {
    current: 'wind_risk_2011',
    future: 'wind_risk_2047',
  },
}

export const RISKS = {
  fire: {
    attributes: FIRE_ATTRIBUTES,
    colormap: 'fire-risk',
    binRatios: [0.1, 0.2, 0.5, 1],
    bounds: {
      min: 0.01,
      max: 25,
    },
  },
} as const
