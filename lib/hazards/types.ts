// To add a hazard: create lib/hazards/<name>.ts exporting a HazardConfig and
// register it in lib/hazards/index.ts.

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

// Only needed for stores whose metadata doesn't fully describe the grid.
export type HazardRasterOptions = {
  fillValue?: number
  bounds?: [number, number, number, number]
  latIsAscending?: boolean
  zarrVersion?: 2 | 3
  // for stores on a projected grid; bounds are then in the store's own units
  proj4?: string
}

// The pipeline's vector outputs. Attributes-mode tiles carry each dataset
// variable, and region files summarize it as `${variable}_median` and
// `${variable}_hist`.
export type HazardVectorData = {
  version: string
  // geoparquet-lod file of building footprints; feature ids are its row
  // numbers, so they differ between files
  buildings: string
  // region GeoParquet: nation.parquet, states.parquet, counties partitioned by
  // state, tracts and blocks by county. Absent while a hazard's regions are
  // still in production.
  regions?: string
  // hist column by variable, for region files written before `${variable}_hist`
  histColumns?: Record<string, string>
  // per-level stats.csv and stats.geojson
  statsBase?: string
  // building columns read by row on selection, beyond the dataset variables
  detailColumns: string[]
  // building columns in region downloads
  downloadColumns: string[]
}

export type SelectorDimension = 'return_period'

// Extra dimension the layer's variable is sliced along (e.g. return_period)
export type HazardLayerSelector = {
  dim: SelectorDimension
  values: number[]
  defaultValue: number
}

// An alternate map layer showing the physical quantity rather than the modeled
// loss (e.g. wind speed), read from a different variable in the same stores.
export type HazardMapLayer = {
  id: string
  variable?: string
  // values are multiplied by unitScale into this unit
  unit: string
  unitScale: number
  binBoundaries: number[]
  binLabels?: string[]
  axisLabel?: string
  customColormap?: boolean
  selector?: HazardLayerSelector
}

export type HazardDatasets = {
  current: HazardDataset
  future?: HazardDataset | Record<FutureWindow, HazardDataset>
}

// 'raster' reads the rendered variable back off the layer; 'bands' opens the
// store directly, for panels needing bands the map isn't drawing
export type PointQuerySource = 'bands' | 'raster'

// Present when the risk view is a measured quantity rather than a 1-10 loss
// score: the results panel shows the value itself and the score bar drops its
// numerals to serve as a plain colorbar.
export type HazardValueDisplay = {
  format: (value: number) => string
}

export type HazardConfig = {
  id: 'fire' | 'flood' | 'wind'
  label: string
  accentColor: string
  description: string
  colormap: string
  // bin edges are in display units; unitScale converts raw store values into
  // them (e.g. fraction/yr -> %)
  binBoundaries: number[]
  unitScale: number
  // 'attributes': buildings colored from the tiles' dataset variables;
  // 'query': buildings transparent, values read from the zarr at their centroid
  buildingsMode: 'attributes' | 'query'
  pointQuery?: PointQuerySource
  valueDisplay?: HazardValueDisplay
  axisLabel: string
  climateTooltip?: string
  rasterOptions?: HazardRasterOptions
  datasets: HazardDatasets
  timePeriodLabels: {
    current: string
    future?: string | Record<FutureWindow, string>
  }
  vector: HazardVectorData
  mapLayers?: HazardMapLayer[]
}
