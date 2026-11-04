import { OCR_BUCKET_URL, SOURCE_COOP_URL } from '@/lib/config'
import { HazardConfig } from './types'

const VERSION = 'v1.1.0'

const output = (path: string) =>
  `${SOURCE_COOP_URL}/carbonplan/carbonplan-ocr/output/fire-risk/vector/production/${VERSION}/${path}`

const LOD_BASE = `${OCR_BUCKET_URL}/ocr-explore/geoparquet-lod/fire-risk/${VERSION}`

const PYRAMID =
  process.env.NEXT_PUBLIC_RISK_ZARR_URL ??
  `${SOURCE_COOP_URL}/carbonplan/carbonplan-ocr/output/fire-risk/pyramid/production/${VERSION}/pyramid.zarr`

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
    fillValue: 9.969209968386869e36,
    zarrVersion: 3,
    bounds: [
      -128.3875562194317, 22.428114227623336, -64.05348689808879,
      52.4818488914143,
    ],
    latIsAscending: true,
  },
  datasets: {
    current: { source: PYRAMID, variable: 'rps_2011' },
    future: { source: PYRAMID, variable: 'rps_2047' },
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
  ],
  vector: {
    version: VERSION,
    buildings:
      process.env.NEXT_PUBLIC_BUILDING_URL ??
      `${LOD_BASE}/buildings-5f4556a.lod.parquet`,
    regions:
      process.env.NEXT_PUBLIC_REGIONS_URL ?? `${LOD_BASE}/regions-full-county`,
    histColumns: {
      rps_2011: 'risk_score_2011_hist',
      rps_2047: 'risk_score_2047_hist',
    },
    statsBase: output('region-analysis'),
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
