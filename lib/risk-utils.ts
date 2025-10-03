import { ScenarioKey, Geography, Building } from '@/types/location'
import { BUILDING_ATTRIBUTE_KEYS, GEOGRAPHY_ATTRIBUTE_KEYS } from './config'

export const getBuildingRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof BUILDING_ATTRIBUTE_KEYS)[keyof typeof BUILDING_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const key = timePeriod === 'current' ? 'wind_risk_2011' : 'wind_risk_2047'
  return BUILDING_ATTRIBUTE_KEYS[key]
}

export const getGeographyRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof GEOGRAPHY_ATTRIBUTE_KEYS)[keyof typeof GEOGRAPHY_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const key = timePeriod === 'current' ? 'wind_risk_2011' : 'wind_risk_2047'
  return GEOGRAPHY_ATTRIBUTE_KEYS[key]
}

export const getGeographyAverageRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof GEOGRAPHY_ATTRIBUTE_KEYS)[keyof typeof GEOGRAPHY_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const key =
    timePeriod === 'current' ? 'mean_wind_risk_2011' : 'mean_wind_risk_2047'
  return GEOGRAPHY_ATTRIBUTE_KEYS[key]
}

export const getGeographyRisk = (
  geography: Geography | null,
  timePeriod: ScenarioKey,
): number[] | null => {
  if (!geography) return null
  const riskKey = getGeographyRiskKey(timePeriod)
  const value = geography[riskKey]
  return value ? (JSON.parse(value as string) as number[]) : null
}

export const getRiskScore = (
  selectedBuilding: Building | null,
  timePeriod: ScenarioKey,
): number | null => {
  if (!selectedBuilding) return null
  const riskKey = getBuildingRiskKey(timePeriod)
  return selectedBuilding[riskKey]
}

export const getCountyName = (geography: Geography | null): string | null => {
  if (!geography) return null
  return (geography[GEOGRAPHY_ATTRIBUTE_KEYS.county_name] as string) ?? null
}

export const getBurnProbabilityUsfs = (
  building: Building | null,
  timePeriod: ScenarioKey,
): number | null => {
  if (!building) return null
  const key =
    timePeriod === 'current'
      ? BUILDING_ATTRIBUTE_KEYS.burn_probability_usfs_2011
      : BUILDING_ATTRIBUTE_KEYS.burn_probability_usfs_2047
  return building[key]
}

export const getAdjustedBurnProbability = (
  building: Building | null,
  timePeriod: ScenarioKey,
): number | null => {
  if (!building) return null
  const key =
    timePeriod === 'current'
      ? BUILDING_ATTRIBUTE_KEYS.burn_probability_2011
      : BUILDING_ATTRIBUTE_KEYS.burn_probability_2047
  return building[key]
}

export const getConditionalRiskUsfs = (
  building: Building | null,
): number | null => {
  if (!building) return null
  return building[BUILDING_ATTRIBUTE_KEYS.conditional_risk_usfs]
}
