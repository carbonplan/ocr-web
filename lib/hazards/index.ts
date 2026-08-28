import fire from './fire'
import flood from './flood'
import wind from './wind'
import {
  HazardConfig,
  HazardDataset,
  HazardMapLayer,
  HazardSelection,
} from './types'

export * from './types'

export const RISKS = {
  fire,
  wind,
  flood,
} as const satisfies Record<string, HazardConfig>

export type HazardId = keyof typeof RISKS

export const DEFAULT_HAZARD: HazardId = 'fire'

export const HAZARD_IDS = Object.keys(RISKS) as HazardId[]

export const isHazardId = (value: string): value is HazardId => value in RISKS

export const RISK_LAYER_ID = 'risk'

export const getMapLayer = (
  config: HazardConfig,
  id: string,
): HazardMapLayer | null =>
  id === RISK_LAYER_ID
    ? null
    : (config.mapLayers?.find((layer) => layer.id === id) ?? null)

// Store values are in each layer's native units (fraction/yr, m/s); the risk
// view falls back to the hazard's own scale. Every display path scales through
// here so a layer's value never picks up another layer's unit.
export const getUnitScale = (config: HazardConfig, id: string): number =>
  getMapLayer(config, id)?.unitScale ?? config.unitScale

export const toDisplayUnits = (
  config: HazardConfig,
  id: string,
  value: number | null | undefined,
): number | null => (value == null ? null : value * getUnitScale(config, id))

export const resolveHazardDataset = (
  hazard: HazardConfig,
  selection: HazardSelection,
): HazardDataset => {
  const datasets = hazard.datasets
  if (selection.timePeriod === 'current') return datasets.current
  const future = datasets.future
  if (!future) {
    throw new Error(`No future data available for ${hazard.id}`)
  }
  return 'source' in future
    ? (future as HazardDataset)
    : (future as Record<string, HazardDataset>)[selection.futureWindow]
}
