import { useMemo } from 'react'
import { useStore } from './store'
import { getRiskScore, getGeographyRisk, getCountyName } from './risk-utils'

export const useRiskScore = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const timePeriod = useStore((state) => state.timePeriod)

  return useMemo(
    () => getRiskScore(selectedBuilding, timePeriod),
    [selectedBuilding, timePeriod],
  )
}

export const useCountyData = () => {
  const county = useStore((state) => state.activeGeographies.county)
  const timePeriod = useStore((state) => state.timePeriod)

  return useMemo(
    () => getGeographyRisk(county, timePeriod),
    [county, timePeriod],
  )
}

export const useCensusTractData = () => {
  const censusTract = useStore((state) => state.activeGeographies.censusTract)
  const timePeriod = useStore((state) => state.timePeriod)

  return useMemo(
    () => getGeographyRisk(censusTract, timePeriod),
    [censusTract, timePeriod],
  )
}

export const useCountyName = () => {
  const county = useStore((state) => state.activeGeographies.county)
  return getCountyName(county)
}
