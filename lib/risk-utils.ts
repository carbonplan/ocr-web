import { ScenarioKey, Geography, Building } from '@/types/location'
import { BUILDING_ATTRIBUTE_KEYS, GEOGRAPHY_ATTRIBUTE_KEYS } from './config'

export const getBuildingRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof BUILDING_ATTRIBUTE_KEYS)[keyof typeof BUILDING_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const key = timePeriod === 'current' ? 'rps_2011' : 'rps_2047'
  return BUILDING_ATTRIBUTE_KEYS[key]
}

export const getGeographyRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof GEOGRAPHY_ATTRIBUTE_KEYS)[keyof typeof GEOGRAPHY_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const key =
    timePeriod === 'current' ? 'risk_score_2011_hist' : 'risk_score_2047_hist'
  return GEOGRAPHY_ATTRIBUTE_KEYS[key]
}

export const getGeographyMedianRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof GEOGRAPHY_ATTRIBUTE_KEYS)[keyof typeof GEOGRAPHY_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const key = timePeriod === 'current' ? 'rps_2011_median' : 'rps_2047_median'
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
  return selectedBuilding.properties[riskKey]
}

export const getGeographyName = (
  geography: Geography | null,
): string | null => {
  if (!geography) return null
  return (geography[GEOGRAPHY_ATTRIBUTE_KEYS.name] as string) ?? null
}

export const getGeoid = (geography: Geography | null): string | null => {
  if (!geography) return null
  return (geography[GEOGRAPHY_ATTRIBUTE_KEYS.geoid] as string) ?? null
}

export const getBurnProbabilityUsfs = (
  building: Building | null,
  timePeriod: ScenarioKey,
): number | null => {
  if (!building) return null
  const key =
    timePeriod === 'current'
      ? BUILDING_ATTRIBUTE_KEYS.bp_2011_riley
      : BUILDING_ATTRIBUTE_KEYS.bp_2047_riley
  return building.properties[key]
}

export const getAdjustedBurnProbability = (
  building: Building | null,
  timePeriod: ScenarioKey,
): number | null => {
  if (!building) return null
  const key =
    timePeriod === 'current'
      ? BUILDING_ATTRIBUTE_KEYS.bp_2011
      : BUILDING_ATTRIBUTE_KEYS.bp_2047
  return building.properties[key]
}

export const getConditionalRiskUsfs = (
  building: Building | null,
): number | null => {
  if (!building) return null
  return building.properties[BUILDING_ATTRIBUTE_KEYS.crps_scott]
}

export const getBoundingBox = (
  geography: Geography | null,
): [number, number, number, number] | null => {
  if (!geography) return null
  const bboxString = geography[GEOGRAPHY_ATTRIBUTE_KEYS.bbox]
  if (!bboxString) return null
  const bbox = JSON.parse(bboxString as string) as [
    number,
    number,
    number,
    number,
  ]
  return bbox
}
