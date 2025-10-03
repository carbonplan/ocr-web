import { ScenarioKey } from '@/types/location'
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
