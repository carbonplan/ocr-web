import chroma from 'chroma-js'
import { useMemo } from 'react'
import { useColorMode } from 'theme-ui'
import { useStore } from './store'

export const getColorForRiskScore = (
  score: number | null,
  colormap: string[],
  colorLimits: {
    type: 'continuous' | 'discrete'
    bounds: [number, number]
    binBoundaries: number[]
  },
  fallbackColor: string = 'secondary',
): string => {
  if (score === null || score < colorLimits.bounds[0] || !colormap?.length) {
    return fallbackColor
  }

  const [min, max] = colorLimits.bounds

  if (colorLimits.type === 'discrete') {
    const boundaries = colorLimits.binBoundaries

    let binIndex = 0
    for (let i = 0; i < boundaries.length - 1; i++) {
      if (score >= boundaries[i] && score < boundaries[i + 1]) {
        binIndex = i
        break
      }
      if (i === boundaries.length - 2 && score >= boundaries[i + 1]) {
        binIndex = i + 1
        break
      }
    }

    binIndex = Math.min(binIndex, colormap.length - 1)
    return colormap[binIndex]
  } else {
    const normalizedScore = Math.min(
      Math.max((score - min) / (max - min), 0),
      1,
    )
    const colormapIndex = Math.floor(normalizedScore * (colormap.length - 1))
    return colormap[colormapIndex]
  }
}

export interface ColormapOptions {
  count?: number
  format?: 'hex' | 'rgb'
  mode?: 'light' | 'dark'
}

export function generateFireRiskColormap(
  options: ColormapOptions = {},
): string[] {
  const { count = 256, format = 'hex', mode = 'dark' } = options

  const red = '#f57273'
  const orange = '#e39046'

  let start: chroma.Color
  if (mode === 'dark') {
    start = chroma('#1b1e23').brighten(0)
  } else {
    start = chroma('#FFFFFF').darken(0)
  }

  let ramp: chroma.Color[]

  if (mode === 'dark') {
    ramp = [
      chroma.mix(red, start, 0.5, 'lab'),
      chroma(red).darken(1),
      chroma.mix(orange, red, 0.5, 'lab'),
      chroma(orange),
      chroma(orange).brighten(1),
      chroma(orange).brighten(2),
    ]
  } else {
    ramp = [
      chroma(orange).brighten(2),
      chroma(orange).brighten(1),
      chroma(orange),
      chroma.mix(orange, red, 0.5, 'lab'),
      chroma(red).darken(1),
      chroma(red).darken(1.5),
    ]
  }

  const scale = chroma.scale(ramp).mode('lab')

  if (format === 'hex') {
    return scale.colors(count, 'hex')
  } else if (format === 'rgb') {
    return scale.colors(count).map((c) => chroma(c).css())
  }
  return scale.colors(count, 'hex')
}

export function generateColormap(
  name: string,
  options: ColormapOptions = {},
): string[] {
  switch (name) {
    case 'fire-risk':
      return generateFireRiskColormap(options)
    default:
      console.warn(`Unknown colormap: ${name}, falling back to fire-risk`)
      return generateFireRiskColormap(options)
  }
}

export function useColormap(
  options?: Omit<ColormapOptions, 'mode' | 'count'>,
): string[] {
  const [colorMode] = useColorMode()
  const riskConfig = useStore((state) => state.riskConfig)
  const colorLimits = useStore((state) => state.colorLimits)

  const mode = colorMode === 'dark' ? 'dark' : 'light'
  const count =
    colorLimits.type === 'discrete' ? colorLimits.binBoundaries.length : 256

  return useMemo(() => {
    return generateColormap(riskConfig.colormap, { ...options, mode, count })
  }, [riskConfig.colormap, options, mode, count])
}
