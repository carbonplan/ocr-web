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
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))
  const isDiscrete = useStore((state) => state.colorLimits.type === 'discrete')
  const [min, max] = useStore(useShallow((state) => state.colorLimits.bounds))

  let value: number | null = null
  if (geo) {
    value =
      GEOGRAPHY_ATTRIBUTE_KEYS.building_count in geo &&
      GEOGRAPHY_ATTRIBUTE_KEYS.geoid in geo
        ? Number(geo[getGeographyMedianRiskKey(timePeriod)])
        : getRiskScore(geo, timePeriod)
  }

  const score = useMemo(() => {
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

    if (isDiscrete) {
      const binIndex = bins.findIndex((bin, i) =>
        i === bins.length - 1 ? i : value >= bin && value < bins[i + 1],
      )

      return colormap[binIndex]
    } else {
      const normalizedScore = Math.min(
        Math.max((value - min) / (max - min), 0),
        1,
      )
      const colormapIndex = Math.floor(normalizedScore * (colormap.length - 1))
      return colormap[colormapIndex]
    }
  }, [isDiscrete, colormap, min, max, value, bins, fallbackColor])

  return { score, value, color }
}
