export const BASE_PATH = '/research/climate-risk'

export const DATA_VERSION = 'v1.1.0'

// Source Coop's bucket name contains dots, so only path-style URLs work —
// virtual-hosted style (bucket.s3.amazonaws.com) fails TLS validation.
const S3_BUCKET_URL =
  'https://s3.us-west-2.amazonaws.com/us-west-2.opendata.source.coop'

const dataUrl = (kind: 'vector' | 'pyramid', path: string) =>
  `${S3_BUCKET_URL}/carbonplan/carbonplan-ocr/output/fire-risk/${kind}/production/${DATA_VERSION}/${path}`

export const DATA_URLS = {
  vector: {
    buildings:
      process.env.NEXT_PUBLIC_BUILDING_URL ??
      dataUrl('vector', 'pmtiles/buildings.pmtiles'),
    regions:
      process.env.NEXT_PUBLIC_REGIONS_URL ??
      dataUrl('vector', 'pmtiles/regions.pmtiles'),
    buildingPoints:
      process.env.NEXT_PUBLIC_BUILDING_POINTS_URL ??
      dataUrl('vector', 'pmtiles/building_centroids.pmtiles'),
  },
  raster:
    process.env.NEXT_PUBLIC_RISK_ZARR_URL ?? dataUrl('pyramid', 'pyramid.zarr'),
  parquetBase:
    process.env.NEXT_PUBLIC_GEOPARQUET_URL ??
    dataUrl('vector', 'geoparquet/buildings.parquet'),
  regionAnalysisBase: dataUrl('vector', 'region-analysis'),
}

// Root for ListObjectsV2 requests against whichever bucket holds the parquet.
// Path-style URLs put the bucket after the host; anything else is virtual-hosted.
export const PARQUET_BUCKET_URL = DATA_URLS.parquetBase.startsWith(
  S3_BUCKET_URL,
)
  ? S3_BUCKET_URL
  : new URL(DATA_URLS.parquetBase).origin

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

export const RASTER_ZOOM_THRESHOLD = 14

export const GEOGRAPHY_MIN_ZOOM = {
  nation: 0,
  state: 5,
  county: 6,
  censusTract: 7,
  censusBlock: 9,
} as const
