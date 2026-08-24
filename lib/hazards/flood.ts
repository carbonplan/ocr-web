import { HazardConfig } from './types'

const FDP_BASE =
  process.env.NEXT_PUBLIC_FLOOD_ZARR_BASE ??
  'https://carbonplan-ocr.s3.amazonaws.com/ocr-explore/FDP/processed'

const flood: HazardConfig = {
  id: 'flood',
  label: 'Flood',
  accentColor: 'blue',
  description:
    'Flood risk is the modeled probability that a location has suffered flood damage, from the USGS random-forest model of Collins et al. (2022).',
  colormap: 'blues',
  // placeholder decile score bins until flood scoring is calibrated
  binBoundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
  // fdp is stored as a probability in [0, 1]
  unitScale: 100,
  buildingsMode: 'query',
  pointQuery: 'raster',
  axisLabel: 'Flood damage probability',
  selectPrompt: 'Select a building to view its flood risk.',
  rasterOptions: {
    zarrVersion: 3,
  },
  // the model carries no climate scenario dimension
  datasets: {
    static: {
      source: `${FDP_BASE}/flood_damage_probability`,
      variable: 'fdp',
    },
  },
  results: [
    {
      key: 'regionalRisk',
      placeholder: 'Regional flood statistics are in production.',
    },
    { key: 'floodAbout' },
  ],
}

export default flood
