import { OCR_BUCKET_URL } from '@/lib/config'
import { HazardConfig } from './types'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'

// the full CONUS refit run (ocr-multi-hazard FDP stages), not yet promoted to
// output/flood
const VERSION = 'v0.0.0-fdp-conus'

// Store order of the `driver` dimension and of dominant_driver's classes.
export const FDP_DRIVERS = [
  { label: '100-yr floodplain', short: 'FP' },
  { label: 'Distance to stream', short: 'DIST' },
  { label: 'Elevation', short: 'ELEV' },
  { label: 'Height above drainage', short: 'HAND' },
  { label: 'Land cover', short: 'LC' },
  { label: 'Profile curvature', short: 'CURV' },
  { label: 'Hydric soils', short: 'SOIL' },
  { label: 'Wetness index', short: 'TWI' },
  { label: 'Channelization', short: 'CHAN' },
  { label: 'Road density', short: 'ROAD' },
  { label: 'Max 3-day precip', short: 'PRCP' },
]

const DRIVER_INDICES = FDP_DRIVERS.map((_, i) => i)

const OUTPUT =
  process.env.NEXT_PUBLIC_FLOOD_OUTPUT_URL ??
  `${OCR_BUCKET_URL}/scratch/shane/flood/${VERSION}`

const flood: HazardConfig = {
  id: 'flood',
  label: 'Flood',
  accentColor: 'blue',
  description:
    'Flood risk is the modeled probability that a location has suffered flood damage, from a refit of the USGS random-forest model.',
  climateTooltip:
    'Current estimates are from models trained on flood damage events reported between 2006 and 2025, one per HUC-2 watershed across the contiguous U.S.',
  colormap: 'blues',
  // placeholder decile score bins until flood scoring is calibrated
  binBoundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
  // fdp is stored as a probability in [0, 1]
  unitScale: 100,
  buildingsMode: 'attributes',
  axisLabel: 'Flood damage probability',
  rasterOptions: {
    zarrVersion: 3,
  },
  // the model carries no climate scenario dimension
  datasets: {
    current: {
      source: `${OUTPUT}/store.icechunk`,
      store: 'icechunk',
      variable: 'fdp',
    },
  },
  timePeriodLabels: {
    current: '2006-2025',
  },
  vector: {
    version: VERSION,
    buildings: `${OUTPUT}/vector/buildings.geoparquet`,
    regions: `${OUTPUT}/vector/regions`,
    regionsExtension: 'geoparquet',
    detailColumns: [],
    downloadColumns: ['fdp'],
  },
  mapLayers: [
    {
      id: 'fdp',
      unit: '%',
      unitScale: 100,
      binBoundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
    },
    {
      id: 'fdp_se',
      variable: 'fdp_se',
      axisLabel: 'Standard error',
      unit: '%',
      unitScale: 100,
      binBoundaries: [4, 10],
      continuous: true,
      colormap: 'cool',
    },
    {
      id: 'contribution',
      variable: 'contribution',
      axisLabel: 'Δ Probability',
      unit: '%',
      unitScale: 100,
      binBoundaries: [-15, 15],
      continuous: true,
      colormap: 'orangeblue',
      // the int16 fill reads as -3.2768 once scaled
      validRange: [-1, 1],
      selector: { dim: 'driver', values: DRIVER_INDICES, defaultValue: 0 },
    },
    {
      id: HISTORIC_FLOODS_LAYER_ID,
      kind: 'events',
      axisLabel: 'Flood year',
      unit: '',
      unitScale: 1,
      binBoundaries: [2000, 2005, 2010, 2015, 2020],
      customColormap: true,
    },
  ],
}

export default flood
