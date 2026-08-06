import { useShallow } from 'zustand/shallow'

import { Geography, Building } from '@/types/location'
import { GEOGRAPHY_ATTRIBUTE_KEYS } from '@/lib/config'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { useMemo } from 'react'
import { getGeographyMedianRiskKey, getRiskScore } from '@/lib/risk-utils'

export const useScore = (
  geo: Building | Geography | null,
  fallbackColor: string = 'secondary',
) => {
  const colormap = useColormap()
  const timePeriod = useStore((state) => state.timePeriod)
  const buildingsMode = useStore((state) => state.riskConfig.buildingsMode)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const selectedArea = useStore((state) => state.selectedArea)
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))
  const [min] = useStore(useShallow((state) => state.colorLimits.bounds))

  let value: number | null = null
  const isGeography =
    geo &&
    GEOGRAPHY_ATTRIBUTE_KEYS.building_count in geo &&
    GEOGRAPHY_ATTRIBUTE_KEYS.geoid in geo
  if (isGeography) {
    value = Number(geo[getGeographyMedianRiskKey(timePeriod)])
  } else if (buildingsMode === 'query') {
    // building and area values come from the async raster point query
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
