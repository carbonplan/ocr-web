import fire from './fire'
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
} as const satisfies Record<string, HazardConfig>

export type HazardId = keyof typeof RISKS

export const DEFAULT_HAZARD: HazardId = 'fire'

export const HAZARD_IDS = Object.keys(RISKS) as HazardId[]

export const isHazardId = (value: string): value is HazardId => value in RISKS

// the default map layer id: the hazard's risk view
export const RISK_LAYER_ID = 'risk'

// the active alternate map layer, or null when the risk view is selected
export const getMapLayer = (
  config: HazardConfig,
  id: string,
): HazardMapLayer | null =>
  id === RISK_LAYER_ID
    ? null
    : (config.mapLayers?.find((layer) => layer.id === id) ?? null)

export const resolveHazardDataset = (
  hazard: HazardConfig,
  selection: HazardSelection,
): HazardDataset => {
  if (hazard.resolveDataset) return hazard.resolveDataset(selection)
  if (selection.timePeriod === 'current') return hazard.datasets.current
  const future = hazard.datasets.future
  return 'source' in future
    ? (future as HazardDataset)
    : (future as Record<string, HazardDataset>)[selection.futureWindow]
}
