import {
  Geography,
  Building,
  BuildingProperties,
  Coordinates,
  Extent,
} from '@/types/location'
import type { BuildingQueryState } from './store'
import {
  HazardConfig,
  HazardSelection,
  RISK_LAYER_ID,
  resolveHazardDataset,
  toDisplayUnits,
} from './hazards'

/** The dataset variable the risk view shows for `selection`. */
export const getRiskVariable = (
  hazard: HazardConfig,
  selection: HazardSelection,
): string => resolveHazardDataset(hazard, selection).variable

/** The selected building's properties, or a selected point's store values
 * once they have been read. */
export const getSelectionProperties = (state: {
  selectedBuilding: Building | null
  selectedArea: Coordinates | null
  buildingQuery: BuildingQueryState
}): BuildingProperties | null => {
  if (state.selectedBuilding) return state.selectedBuilding.properties
  if (state.selectedArea && state.buildingQuery.status === 'success')
    return state.buildingQuery.values ?? null
  return null
}

/** The risk value in `properties`, in display units. */
export const getRiskScore = (
  properties: BuildingProperties | null,
  hazard: HazardConfig,
  selection: HazardSelection,
): number | null =>
  toDisplayUnits(
    hazard,
    RISK_LAYER_ID,
    properties?.[getRiskVariable(hazard, selection)],
  )

/** The region's median building risk, in display units. */
export const getGeographyMedian = (
  geography: Geography | null,
  hazard: HazardConfig,
  selection: HazardSelection,
): number | null =>
  toDisplayUnits(
    hazard,
    RISK_LAYER_ID,
    geography?.median[getRiskVariable(hazard, selection)],
  )

/** Building counts per risk score, from 0 up. */
export const getGeographyRisk = (
  geography: Geography | null,
  hazard: HazardConfig,
  selection: HazardSelection,
): number[] | null =>
  geography?.hist[getRiskVariable(hazard, selection)] ?? null

export const getGeographyName = (geography: Geography | null): string | null =>
  geography?.name ?? null

export const getGeoid = (geography: Geography | null): string | null =>
  geography?.geoid ?? null

export const getBoundingBox = (geography: Geography | null): Extent | null =>
  geography?.bbox ?? null

// fire's components of risk of loss, from getSelectionProperties
export const getBurnProbabilityUsfs = (
  properties: BuildingProperties | null,
  timePeriod: HazardSelection['timePeriod'],
): number | null =>
  properties?.[timePeriod === 'current' ? 'bp_2011_riley' : 'bp_2047_riley'] ??
  null

export const getAdjustedBurnProbability = (
  properties: BuildingProperties | null,
  timePeriod: HazardSelection['timePeriod'],
): number | null =>
  properties?.[timePeriod === 'current' ? 'bp_2011' : 'bp_2047'] ?? null

export const getConditionalRiskUsfs = (
  properties: BuildingProperties | null,
): number | null => properties?.crps_scott ?? null
