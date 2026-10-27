export const BASE_PATH = '/research/climate-risk'

export const DATA_VERSION = 'v1.1.0'

// Source Coop's bucket name contains dots, so only path-style URLs work —
// virtual-hosted style (bucket.s3.amazonaws.com) fails TLS validation.
const S3_BUCKET_URL =
  'https://s3.us-west-2.amazonaws.com/us-west-2.opendata.source.coop'

const dataUrl = (kind: 'vector' | 'pyramid', path: string) =>
  `${S3_BUCKET_URL}/carbonplan/carbonplan-ocr/output/fire-risk/${kind}/production/${DATA_VERSION}/${path}`

const LOD_BASE_URL = `https://carbonplan-ocr.s3.us-west-2.amazonaws.com/ocr-explore/geoparquet-lod/fire-risk/${DATA_VERSION}`

export const DATA_URLS = {
  vector: {
    // geoparquet-lod file: building footprints with display overviews
    buildings:
      process.env.NEXT_PUBLIC_BUILDING_URL ??
      `${LOD_BASE_URL}/buildings-hybrid-mercator.lod.parquet`,
    // GeoParquet region files; tracts and blocks are partitioned by county
    regions:
      process.env.NEXT_PUBLIC_REGIONS_URL ??
      `${LOD_BASE_URL}/regions-full-county`,
  },
  raster:
    process.env.NEXT_PUBLIC_RISK_ZARR_URL ?? dataUrl('pyramid', 'pyramid.zarr'),
  regionAnalysisBase: dataUrl('vector', 'region-analysis'),
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
  buildings: {
    layerName: 'risk',
    sourceId: 'buildings',
    layerIds: {
      fill: 'risk-buildings-fill',
      line: 'risk-buildings-line',
    },
  },
  regionHighlight: {
    sourceId: 'region-highlight',
    layerIds: {
      line: 'region-highlight-line',
    },
  },
} as const

export const BUILDING_ATTRIBUTE_KEYS = {
  rps_2011: 'rps_2011',
  rps_2047: 'rps_2047',
  bp_2011: 'bp_2011',
  bp_2047: 'bp_2047',
  crps_scott: 'crps_scott',
  bp_2011_riley: 'bp_2011_riley',
  bp_2047_riley: 'bp_2047_riley',
} as const

// carried in the building tiles for styling; the rest are read on selection
export const BUILDING_TILE_PROPERTIES = [
  BUILDING_ATTRIBUTE_KEYS.rps_2011,
  BUILDING_ATTRIBUTE_KEYS.rps_2047,
]
export const BUILDING_DETAIL_COLUMNS = [
  BUILDING_ATTRIBUTE_KEYS.bp_2011,
  BUILDING_ATTRIBUTE_KEYS.bp_2047,
  BUILDING_ATTRIBUTE_KEYS.crps_scott,
  BUILDING_ATTRIBUTE_KEYS.bp_2011_riley,
  BUILDING_ATTRIBUTE_KEYS.bp_2047_riley,
]

// The finest zoom with building overviews; MapLibre overzooms those tiles
// beyond it, as it does PMTiles, rather than asking the reader for tiles drawn
// from the original geometry, which read far more.
export const BUILDING_MAX_ZOOM = 14

// Below this zoom the building overviews hold only buildings with nonzero
// risk, so a click there is not a building selection.
export const BUILDING_SELECT_MIN_ZOOM = 6

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
