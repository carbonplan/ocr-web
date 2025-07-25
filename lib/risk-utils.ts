import { MapGeoJSONFeature } from 'maplibre-gl'
import {
  Building,
  County,
  MethodKey,
  ScenarioKey,
  TimeHorizon,
} from '@/types/location'
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

  const result: Building = {} as Building
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

const getPlotData = (countsString: string): number[][] => {
  if (!countsString) {
    return []
  }

  try {
    const counts = JSON.parse(countsString) as number[]
    return counts.map((count, i) => [i + 0.5, count])
  } catch (error) {
    console.error('Error parsing counts data:', error)
    return []
  }
}

const HORIZONS: TimeHorizon[] = [1, 15, 30]
export const getCountyData = (
  properties: MapGeoJSONFeature['properties'] | null,
  riskConfig: (typeof RISKS)[keyof typeof RISKS],
): County | null => {
  if (!properties) {
    return null
  }

  const result: County = {
    name: properties.county_name as string,
    buildingCount: properties.building_count as number,
    risk: {
      baseRisk: { current: {}, future: {} },
      windRisk: { current: {}, future: {} },
    },
  } as County

  Object.keys(riskConfig.attributes).forEach((methodKey) => {
    Object.keys(riskConfig.attributes[methodKey as MethodKey]).forEach(
      (scenarioKey) => {
        HORIZONS.forEach((horizon: TimeHorizon) => {
          const riskKey =
            riskConfig.attributes[methodKey as MethodKey][
              scenarioKey as ScenarioKey
            ]
          const propertyKey = `${riskKey}_horizon_${horizon}`
          result.risk[methodKey as MethodKey][scenarioKey as ScenarioKey][
            horizon
          ] = {
            average: properties[`avg_${propertyKey}`] as number,
            plotData: getPlotData(properties[propertyKey]),
          }
        })
      },
    )
  })

  return result
}
