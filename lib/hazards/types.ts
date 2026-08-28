// To add a hazard: create lib/hazards/<name>.ts exporting a HazardConfig and
// register it in lib/hazards/index.ts.

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

// Absent while a hazard's regional data is still in production.
export type RegionalDataConfig = {
  statsBase: string
  parquetBase: string
  parquetBucketUrl: string
  // value columns in the geoparquet, beyond GEOID + centroid
  columns: string[]
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
  selector?: HazardLayerSelector
  // reads this layer's value, in store units, off the point-query result
  pointValue?: (
    detail: ChazPointData,
    selectorValue: number | null,
  ) => number | null
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
  // 'attributes': buildings colored from pmtiles properties;
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
  regionalData?: RegionalDataConfig
  mapLayers?: HazardMapLayer[]
}
