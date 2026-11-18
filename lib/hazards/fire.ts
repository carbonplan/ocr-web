import { OCR_BUCKET_URL } from '@/lib/config'
import { HazardConfig } from './types'
import { HISTORIC_FIRES_LAYER_ID } from '@/lib/historic-events'

const VERSION = 'v2.0.0'

const OUTPUT = `${OCR_BUCKET_URL}/output/fire/${VERSION}`

const RASTER =
  process.env.NEXT_PUBLIC_FIRE_ICECHUNK_URL ?? `${OUTPUT}/store.icechunk`

const fire: HazardConfig = {
  id: 'fire',
  label: 'Fire',
  accentColor: 'red',
  description:
    'Wildfire risk estimates the expected annual risk of loss from wildfire for every building in the contiguous U.S.',
  colormap: 'reds',
  binBoundaries: [0, 0.01, 0.02, 0.035, 0.06, 0.1, 0.2, 0.5, 1, 3],
  unitScale: 1,
  buildingsMode: 'attributes',
  axisLabel: 'Risk of loss',
  climateTooltip:
    'Current risk estimates are based on a climate circa 2004-2018, while future estimates use a climate representative of 2040-2054. Both estimates use vegetation from the early 2020s.',
  rasterOptions: {
    zarrVersion: 3,
  },
  datasets: {
    current: { source: RASTER, store: 'icechunk', variable: 'rps_2011' },
    future: { source: RASTER, store: 'icechunk', variable: 'rps_2047' },
  },
  timePeriodLabels: {
    current: '2004-2018',
    future: '2040-2054',
  },
  mapLayers: [
    {
      id: 'rps',
      unit: '%',
      unitScale: 1,
      binBoundaries: [0, 0.01, 0.02, 0.035, 0.06, 0.1, 0.2, 0.5, 1, 3],
    },
    {
      id: 'bp',
      variable: { current: 'bp_2011', future: 'bp_2047' },
      unit: '#',
      unitScale: 1,
      // annual probability; half of burnable land is below 0.001
      binBoundaries: [
        0, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05,
      ],
      axisLabel: 'Burn probability',
      // its own colorbar: bins are not risk scores, and have no names
      customColormap: true,
      binLabels: Array(10).fill(''),
    },
    {
      id: 'crps',
      variable: 'crps_scott',
      unit: '%',
      unitScale: 1,
      binBoundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
      axisLabel: 'Conditional risk',
      customColormap: true,
      binLabels: Array(10).fill(''),
    },
    {
      id: HISTORIC_FIRES_LAYER_ID,
      kind: 'events',
      axisLabel: 'Ignition year',
      unit: '',
      unitScale: 1,
      binBoundaries: [1984, 1990, 2000, 2010, 2020],
      customColormap: true,
    },
  ],
  vector: {
    version: VERSION,
    buildings:
      process.env.NEXT_PUBLIC_BUILDING_URL ??
      `${OUTPUT}/vector/buildings.geoparquet`,
    regions: process.env.NEXT_PUBLIC_REGIONS_URL ?? `${OUTPUT}/vector/regions`,
    detailColumns: [
      'bp_2011',
      'bp_2047',
      'crps_scott',
      'bp_2011_riley',
      'bp_2047_riley',
    ],
    downloadColumns: [
      'rps_2011',
      'rps_2047',
      'bp_2011',
      'bp_2047',
      'crps_scott',
      'bp_2011_riley',
      'bp_2047_riley',
    ],
  },
}

export default fire
