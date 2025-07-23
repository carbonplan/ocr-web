import { MapGeoJSONFeature } from 'maplibre-gl'
import { Building, RiskScoreSet } from '@/types/location'
import { RISKS } from './config'

const calculateRiskScores = (annualProbability: number) => {
  return {
    1: annualProbability * 100,
    15: (1 - Math.pow(1 - annualProbability, 15)) * 100,
    30: (1 - Math.pow(1 - annualProbability, 30)) * 100,
  }
}

export const getBuildingRiskScores = (
  building: MapGeoJSONFeature['properties'] | null,
  riskConfig: (typeof RISKS)[keyof typeof RISKS],
): Building | null => {
  if (!building) {
    return null
  }

  const hasAllKeys = Object.keys(riskConfig.attributes).every((key: string) => {
    const subKeys =
      riskConfig.attributes[key as keyof typeof riskConfig.attributes]
    return building[subKeys.current] && building[subKeys.future]
  })

  if (!hasAllKeys) {
    return null
  }

  const result: Record<keyof typeof riskConfig.attributes, RiskScoreSet> =
    {} as Record<keyof typeof riskConfig.attributes, RiskScoreSet>
  Object.keys(riskConfig.attributes).forEach((key: string) => {
    const subKeys =
      riskConfig.attributes[key as keyof typeof riskConfig.attributes]

    result[key as keyof typeof riskConfig.attributes] = {
      current: calculateRiskScores(Number(building[subKeys.current])),
      future: calculateRiskScores(Number(building[subKeys.future])),
    }
  })

  return result
}
