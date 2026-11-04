export const BASE_PATH = '/research/climate-risk'

// Source Coop's bucket name contains dots, so only path-style URLs work —
// virtual-hosted style (bucket.s3.amazonaws.com) fails TLS validation.
export const SOURCE_COOP_URL =
  'https://s3.us-west-2.amazonaws.com/us-west-2.opendata.source.coop'

export const OCR_BUCKET_URL =
  'https://carbonplan-ocr.s3.us-west-2.amazonaws.com'

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

// The finest zoom with building overviews; MapLibre overzooms those tiles
// beyond it, as it does PMTiles, rather than asking the reader for tiles drawn
// from the original geometry, which read far more.
export const BUILDING_MAX_ZOOM = 14

// Below this zoom the building overviews hold only buildings with nonzero
// risk, so a click there is not a building selection.
export const BUILDING_SELECT_MIN_ZOOM = 6

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
