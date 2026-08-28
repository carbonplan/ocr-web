import { useShallow } from 'zustand/shallow'

import { Geography, Building } from '@/types/location'
import { GEOGRAPHY_ATTRIBUTE_KEYS } from '@/lib/config'
import { useStore } from '@/lib/store'
import { getMapLayer } from '@/lib/hazards'
import { useColormap } from '@/lib/colormaps'
import { useMemo } from 'react'
import { getGeographyMedianRiskKey, getRiskScore } from '@/lib/risk-utils'

// colorLimits follows the displayed map layer; its bins only describe the score
// when that layer has no `variable` of its own, and so renders the same
// quantity the score is computed from.
export const useScoreLimits = () => {
  const showsRiskQuantity = useStore(
    (state) => !getMapLayer(state.riskConfig, state.mapLayer)?.variable,
  )
  const hazardBins = useStore((state) => state.riskConfig.binBoundaries)
  const displayBins = useStore(
    useShallow((state) => state.colorLimits.binBoundaries),
  )
  const [displayMin] = useStore(useShallow((state) => state.colorLimits.bounds))

  return showsRiskQuantity
    ? { bins: displayBins, min: displayMin }
    : { bins: hazardBins, min: hazardBins[0] }
}

export const useScore = (
  geo: Building | Geography | null,
  fallbackColor: string = 'secondary',
) => {
  const timePeriod = useStore((state) => state.timePeriod)
  const buildingsMode = useStore((state) => state.riskConfig.buildingsMode)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const selectedArea = useStore((state) => state.selectedArea)
  const { bins, min } = useScoreLimits()
  const colormap = useColormap({ count: bins.length })

  let value: number | null = null
  const isGeography =
    geo &&
    GEOGRAPHY_ATTRIBUTE_KEYS.building_count in geo &&
    GEOGRAPHY_ATTRIBUTE_KEYS.geoid in geo
  if (isGeography) {
    value = Number(geo[getGeographyMedianRiskKey(timePeriod)])
  } else if (buildingsMode === 'query') {
    if (geo || selectedArea) {
      value = buildingQuery.status === 'success' ? buildingQuery.value : null
    }
  } else if (geo) {
    value = getRiskScore(geo, timePeriod)
  }

  const score = useMemo(() => {
    if (value === 0.0) {
      return '0'
    }
    if (typeof value === 'number') {
      return String(
        bins.findIndex((bin, i) =>
          i === bins.length - 1 && value >= bin
            ? i
            : value >= bin && value < bins[i + 1],
        ) + 1,
      )
    } else {
      return null
    }
  }, [value, bins])

  const color = useMemo(() => {
    if (value === null || value < min || !colormap?.length) {
      return fallbackColor
    }

    if (value === 0) {
      return colormap[0]
    }

    const binIndex = bins.findIndex(
      (bin, i) => value >= bin && value < bins[i + 1],
    )

    return colormap[binIndex === -1 ? colormap.length - 1 : binIndex + 1]
  }, [colormap, min, value, bins, fallbackColor])

  return { score, value, color }
}
