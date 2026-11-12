export const BASE_PATH = '/research/climate-risk'

// Source Coop's bucket name contains dots, so only path-style URLs work —
// virtual-hosted style (bucket.s3.amazonaws.com) fails TLS validation.
export const SOURCE_COOP_URL =
  'https://s3.us-west-2.amazonaws.com/us-west-2.opendata.source.coop'

export const OCR_BUCKET_URL =
  'https://carbonplan-ocr.s3.us-west-2.amazonaws.com'

const EXPLORE_URL =
  'https://carbonplan-ocr.s3.us-west-2.amazonaws.com/ocr-explore'

// ocr-multi-hazard's historic inputs, dated by their source's Last-Modified
const HISTORIC_INPUT_URL =
  'https://carbonplan-ocr.s3.us-west-2.amazonaws.com/input/historic'

export const HISTORIC_URLS = {
  stormTracks: `${HISTORIC_INPUT_URL}/ibtracs/20261112/ibtracs_tracks.parquet`,
  firePerimeters: `${EXPLORE_URL}/mtbs_conus_perims.pmtiles`,
  floodReports: `${EXPLORE_URL}/storm_events_conus_floods.pmtiles`,
  floodReportPoints: `${EXPLORE_URL}/storm_events_conus_flood_points.pmtiles`,
  floodSatellite: `${EXPLORE_URL}/gfd_conus_footprints.pmtiles`,
  floodNews: `${EXPLORE_URL}/groundsource_conus_centroids.pmtiles`,
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
  stormTracks: {
    sourceId: 'stormTracks',
    layerIds: {
      line: 'storm-tracks-line',
    },
  },
  firePerimeters: {
    layerName: 'mtbs_perims',
    sourceId: 'firePerimeters',
    layerIds: {
      fill: 'fire-perimeters-fill',
      line: 'fire-perimeters-line',
    },
  },
  floodReports: {
    layerName: 'floods',
    sourceId: 'floodReports',
    layerIds: {
      line: 'flood-reports-line',
    },
  },
  floodReportPoints: {
    layerName: 'floods',
    sourceId: 'floodReportPoints',
    layerIds: {
      circle: 'flood-report-points-circle',
    },
  },
  floodSatellite: {
    layerName: 'gfd',
    sourceId: 'floodSatellite',
    layerIds: {
      fill: 'flood-satellite-fill',
      hover: 'flood-satellite-hover',
    },
  },
  floodNews: {
    layerName: 'groundsource',
    sourceId: 'floodNews',
    layerIds: {
      circle: 'flood-news-circle',
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
