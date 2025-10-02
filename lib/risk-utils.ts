import { ScenarioKey } from '@/types/location'
import { BUILDING_ATTRIBUTE_KEYS, GEOGRAPHY_ATTRIBUTE_KEYS } from './config'

export const getBuildingRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof BUILDING_ATTRIBUTE_KEYS)[keyof typeof BUILDING_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const year = timePeriod === 'current' ? '2011' : '2047'
  const key = `wind_risk_${year}` as keyof typeof BUILDING_ATTRIBUTE_KEYS
  return BUILDING_ATTRIBUTE_KEYS[key]
}

export const getGeographyRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof GEOGRAPHY_ATTRIBUTE_KEYS)[keyof typeof GEOGRAPHY_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const year = timePeriod === 'current' ? '2011' : '2047'
  const key = `wind_risk_${year}` as keyof typeof GEOGRAPHY_ATTRIBUTE_KEYS
  return GEOGRAPHY_ATTRIBUTE_KEYS[key]
}

export const getGeographyAverageRiskKey: (
  timePeriod: ScenarioKey,
) => (typeof GEOGRAPHY_ATTRIBUTE_KEYS)[keyof typeof GEOGRAPHY_ATTRIBUTE_KEYS] = (
  timePeriod: ScenarioKey,
) => {
  const year = timePeriod === 'current' ? '2011' : '2047'
  const key = `mean_wind_risk_${year}` as keyof typeof GEOGRAPHY_ATTRIBUTE_KEYS
  return GEOGRAPHY_ATTRIBUTE_KEYS[key]
}
