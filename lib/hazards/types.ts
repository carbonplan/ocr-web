// Hazard registry types. To add a hazard:
//   1. Create lib/hazards/<name>.ts exporting a HazardConfig.
//   2. Register it in lib/hazards/index.ts (RISKS).
//   3. If it needs hazard-specific results sections, add their keys to
//      ResultSectionKey here and their components to
//      components/results/registry.tsx.
// The risk selector, climate/time-period controls, zarr layer, buildings
// styling, legend, URL state, and results panel all derive from the config.

import { ScenarioKey } from '@/types/location'

export type FutureWindow = 'fut1' | 'fut2'

export type HazardSelection = {
  timePeriod: ScenarioKey
  futureWindow: FutureWindow
}

export type HazardDataset = {
  source: string
  variable: string
}

// Overrides for zarr stores whose metadata doesn't fully describe the grid
// (e.g. fire's tiled pyramid). Untiled multiscales stores need none of these.
export type HazardRasterOptions = {
  fillValue?: number
  bounds?: [number, number, number, number]
  latIsAscending?: boolean
  zarrVersion?: 2 | 3
}

// Regional stats + bulk-download endpoints. Absent while a hazard's regional
// data is still in production; the results panel shows a placeholder instead.
export type RegionalDataConfig = {
  statsBase: string
  parquetBase: string
  parquetBucketUrl: string
  // per-building value columns in the geoparquet, beyond GEOID + centroid
  columns: string[]
}

export type ResultSectionKey =
  | 'riskCalculation'
  | 'timeHorizons'
  | 'regionalRisk'
  | 'otherFactors'
  | 'fireAbout'
  | 'windDetail'
  | 'windAbout'

export type ResultSection = {
  key: ResultSectionKey
  // when set, render the section heading with this "in production" copy
  // instead of the component
  placeholder?: string
}

export type HazardConfig = {
  id: string
  label: string
  // theme color for the risk Filter option
  accentColor: string
  // short copy shown under the risk selector
  description: string
  colormap: string
  // score bin edges in display units
  binBoundaries: number[]
  // multiplies raw store values into display units (e.g. fraction/yr -> %)
  unitScale: number
  // 'attributes': buildings colored from pmtiles properties;
  // 'query': buildings transparent, values fetched from the zarr at the
  // selected building's centroid
  buildingsMode: 'attributes' | 'query'
  axisLabel: string
  selectPrompt: string
  climateTooltip: string
  rasterOptions?: HazardRasterOptions
  datasets: {
    current: HazardDataset
    future: HazardDataset | Record<FutureWindow, HazardDataset>
  }
  // escape hatch for hazards whose data doesn't fit the
  // current/future(/window) shape
  resolveDataset?: (selection: HazardSelection) => HazardDataset
  // drives the time-period row under the climate filter; omit to hide it
  timePeriodLabels?: {
    current: string
    future: Record<FutureWindow, string>
  }
  results: ResultSection[]
  regionalData?: RegionalDataConfig
}
