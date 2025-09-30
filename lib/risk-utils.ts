import { MapGeoJSONFeature } from 'maplibre-gl'
import { Building, Geography, MethodKey, ScenarioKey } from '@/types/location'
import { RISKS } from './config'

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
    return building[subKeys.current] != null && building[subKeys.future] != null
  })

  if (!hasAllKeys) {
    return null
  }

  const result: Building = {} as Building
  Object.keys(riskConfig.attributes).forEach((key: string) => {
    const subKeys =
      riskConfig.attributes[key as keyof typeof riskConfig.attributes]

    result[key as keyof typeof riskConfig.attributes] = {
      current: Number(building[subKeys.current]),
      future: Number(building[subKeys.future]),
    }
  })

  return result
}

const getHistogramData = (countsString: string): number[] => {
  if (!countsString) {
    return []
  }

  try {
    const counts = JSON.parse(countsString) as number[]
    return counts
  } catch (error) {
    console.error('Error parsing counts data:', error)
    return []
  }
}
export const getGeographyData = (
  properties: MapGeoJSONFeature['properties'] | null,
  riskConfig: (typeof RISKS)[keyof typeof RISKS],
  nameProperty: string,
): Geography | null => {
  if (!properties) {
    return null
  }

  const result: Geography = {
    name: properties[nameProperty] as string,
    buildingCount: properties.building_count as number,
    risk: {
      baseRisk: { current: {}, future: {} },
      windRisk: { current: {}, future: {} },
    },
  } as Geography

  Object.keys(riskConfig.attributes).forEach((methodKey) => {
    Object.keys(riskConfig.attributes[methodKey as MethodKey]).forEach(
      (scenarioKey) => {
        const riskKey =
          riskConfig.attributes[methodKey as MethodKey][
            scenarioKey as ScenarioKey
          ]
        const horizonProperty = `${riskKey}_horizon_1`
        result.risk[methodKey as MethodKey][scenarioKey as ScenarioKey] = {
          average: properties[`avg_${horizonProperty}`] as number,
          data: getHistogramData(properties[horizonProperty]),
        }
      },
    )
  })

  return result
}
