import fire from './fire'
import wind from './wind'
import { HazardConfig, HazardDataset, HazardSelection } from './types'

export * from './types'

export const RISKS = {
  fire,
  wind,
} as const satisfies Record<string, HazardConfig>

export type HazardId = keyof typeof RISKS

export const DEFAULT_HAZARD: HazardId = 'fire'

export const HAZARD_IDS = Object.keys(RISKS) as HazardId[]

export const isHazardId = (value: string): value is HazardId => value in RISKS

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
