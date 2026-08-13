// Hazard registry types. To add a hazard:
//   1. Create lib/hazards/<name>.ts exporting a HazardConfig.
//   2. Register it in lib/hazards/index.ts (RISKS).
//   3. If it needs hazard-specific results sections, add their keys to
//      ResultSectionKey here and their components to
//      components/results/registry.tsx.
// The risk selector, climate/time-period controls, zarr layer, buildings
// styling, legend, URL state, and results panel all derive from the config.

import { ScenarioKey } from '@/types/location'
import type { ChazPointData } from '../chaz-query'

export type FutureWindow = 'fut1' | 'fut2'

export type HazardSelection = {
  timePeriod: ScenarioKey
  futureWindow: FutureWindow
}

export type HazardDataset = {
  source: string
  variable: string
  // per-store grid edges, overriding rasterOptions.bounds; skips the render
  // layer's coordinate-array fetch
  bounds?: [number, number, number, number]
}

// Overrides for zarr stores whose metadata doesn't fully describe the grid
// (e.g. fire's tiled pyramid). Untiled multiscales stores need none of these.
export type HazardRasterOptions = {
  fillValue?: number
  bounds?: [number, number, number, number]
  latIsAscending?: boolean
  zarrVersion?: 2 | 3
  // proj4 definition for stores on a projected grid; bounds are then in the
  // store's own units (e.g. metres) and the layer reprojects at render time
  proj4?: string
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

// Extra dimension the layer's variable is sliced along (e.g. return_period)
export type HazardLayerSelector = {
  dim: string
  values: number[]
  defaultValue: number
  // button label in the selector sub-row
  formatOption: (value: number) => string
}

// An alternate map layer for a hazard: the physical quantity itself rather
// than the modeled loss (e.g. wind speed at a return period). Reads a
// different variable from the same stores as the risk view.
export type HazardMapLayer = {
  id: string
  // option label in the LAYER filter row
  label: string
  variable: string
  // display unit; values are multiplied by unitScale into this unit
  unit: string
  unitScale: number
  binBoundaries: number[]
  // per-bin names shown with a selected building's value
  binLabels?: string[]
  // tooltip copy for the LAYER row while this layer is active
  description: string
  // replaces the hazard's selectPrompt while this layer is active
  selectPrompt?: string
  selector?: HazardLayerSelector
  // reads this layer's value (in store units) for a selected building from
  // the point-query result
  pointValue?: (
    detail: ChazPointData,
    selectorValue: number | null,
  ) => number | null
}

// Datasets keyed by time period, or a single one for hazards with no time
// dimension — which also hides the climate filter row.
export type HazardDatasets =
  | {
      current: HazardDataset
      future: HazardDataset | Record<FutureWindow, HazardDataset>
    }
  | { static: HazardDataset }

// Selects direct multi-band store reads or a query against the rendered raster.
// See docs/point-queries.md for their data-layout and pyramid-level tradeoffs.
export type PointQuerySource = 'bands' | 'raster'

// Present when the risk view reads as a measured quantity rather than a 1-10
// loss score: the results panel shows the value itself and the score bar drops
// its numerals to serve as a plain colorbar.
export type HazardValueDisplay = {
  // formats a value in display units for the results badge
  format: (value: number) => string
}

export type ResultSectionKey =
  | 'riskCalculation'
  | 'timeHorizons'
  | 'regionalRisk'
  | 'otherFactors'
  | 'fireAbout'
  | 'windDetail'
  | 'windAbout'
  | 'floodAbout'

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
  pointQuery?: PointQuerySource
  valueDisplay?: HazardValueDisplay
  axisLabel: string
  selectPrompt: string
  // copy for the climate filter row; omit alongside a static dataset
  climateTooltip?: string
  rasterOptions?: HazardRasterOptions
  datasets: HazardDatasets
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
  // alternate map layers; when present the LAYER filter row renders with the
  // risk view (labeled riskLayerLabel) first
  riskLayerLabel?: string
  mapLayers?: HazardMapLayer[]
}
