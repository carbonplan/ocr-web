import chroma from 'chroma-js'
import { useMemo } from 'react'
import { useColorMode } from 'theme-ui'

export const calculateBinBoundaries = (
  [min, max]: [number, number],
  ratios: readonly number[] = [0.1, 0.2, 0.5, 1],
): number[] => {
  const range = max - min
  return [min, ...ratios.slice(0, -1).map((r) => min + r * range), max]
}

export const getColorForRiskScore = (
  score: number | null,
  colormap: string[],
  colorLimits: {
    type: 'continuous' | 'discrete'
    bounds: [number, number]
  },
  binRatios: readonly number[] = [0.1, 0.2, 0.5, 1],
  fallbackColor: string = 'secondary',
): string => {
  if (score === null || score < colorLimits.bounds[0] || !colormap?.length) {
    return fallbackColor
  }

  const [min, max] = colorLimits.bounds

  if (colorLimits.type === 'discrete') {
    const boundaries = calculateBinBoundaries([min, max], binRatios)

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
  mode?: 'light' | 'dark'
}

export function generateFireRiskColormap(
  options: ColormapOptions = {},
): string[] {
  const { count = 256, mode = 'dark' } = options

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
  name: string,
  options: Omit<ColormapOptions, 'mode'> = {},
): string[] {
  const [colorMode] = useColorMode()
  const mode = colorMode === 'dark' ? 'dark' : 'light'

  return useMemo(() => {
    return generateColormap(name, { ...options, mode })
  }, [name, options, mode])
}

export function useColormapRGB(
  name: string,
  options: Omit<ColormapOptions, 'mode'> = {},
): [number, number, number][] {
  const [colorMode] = useColorMode()
  const mode = colorMode === 'dark' ? 'dark' : 'light'

  return useMemo(() => {
    const hexColors = generateColormap(name, { ...options, mode })
    return hexColors.map((c) => chroma(c).rgb())
  }, [name, options, mode])
}
