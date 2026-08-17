import { HazardConfig } from './types'

const FDP_BASE =
  process.env.NEXT_PUBLIC_FLOOD_ZARR_BASE ??
  'https://carbonplan-ocr.s3.amazonaws.com/ocr-explore/FDP/processed'

// NAD83 / Conus Albers (EPSG:5070), the grid the USGS raster ships on
const FDP_PROJ4 =
  '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 ' +
  '+x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs'

const flood: HazardConfig = {
  id: 'flood',
  label: 'Flood',
  accentColor: 'blue',
  description:
    'Flood risk is the modeled probability that a location has suffered flood damage, from the USGS random-forest model of Collins et al. (2022).',
  colormap: 'blues',
  binBoundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
  // fdp is stored as a probability in [0, 1]
  unitScale: 100,
  buildingsMode: 'query',
  pointQuery: 'raster',
  valueDisplay: { format: (value) => `${Math.round(value)}%` },
  axisLabel: 'Flood damage probability',
  selectPrompt:
    'Select a building or point on the map to view its flood damage probability.',
  // the pyramid stays on its native 100 m Albers grid, so bounds are metres
  rasterOptions: {
    zarrVersion: 3,
    proj4: FDP_PROJ4,
    bounds: [-2493045.0, 177305.0, 2342655.0, 3310005.0],
    latIsAscending: false,
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
