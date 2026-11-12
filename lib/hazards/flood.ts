import { HazardConfig } from './types'

const FDP_BASE =
  process.env.NEXT_PUBLIC_FLOOD_ZARR_BASE ??
  'https://carbonplan-ocr.s3.amazonaws.com/ocr-explore/FDP/processed'

// CarbonPlan's refit of the USGS model on Dec 2006–Dec 2025 reports, with its
// per-cell attributions and standard errors. Covers HUC 03 (South
// Atlantic-Gulf) only so far.
const FDP_STORE = `${FDP_BASE}/retrained/noaa-200612-202512-planar`

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

const flood: HazardConfig = {
  id: 'flood',
  label: 'Flood',
  accentColor: 'blue',
  description:
    'Flood risk is the modeled probability that a location has suffered flood damage, from a refit of the USGS random-forest model.',
  climateTooltip:
    'Current estimates are from models trained on flood damage events reported between 2006 and 2025, so far for the South Atlantic-Gulf watershed only.',
  colormap: 'blues',
  // placeholder decile score bins until flood scoring is calibrated
  binBoundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
  // fdp is stored as a probability in [0, 1]
  unitScale: 100,
  buildingsMode: 'query',
  pointQuery: 'raster',
  axisLabel: 'Flood damage probability',
  rasterOptions: {
    zarrVersion: 3,
  },
  // the model carries no climate scenario dimension
  datasets: {
    current: {
      source: FDP_STORE,
      variable: 'fdp',
    },
  },
  timePeriodLabels: {
    current: '2006-2025',
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
      // about the 1st to 90th percentile in HUC 03
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
  ],
}

export default flood
