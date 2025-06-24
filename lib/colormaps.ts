import chroma from 'chroma-js'
import { useMemo } from 'react'
import { useColorMode } from 'theme-ui'

const DEFAULT_BIN_RATIOS = [0.1, 0.2, 0.5, 1] as const

export function calculateBinBoundaries(
  bounds: [number, number],
  ratios: readonly number[] = DEFAULT_BIN_RATIOS,
): number[] {
  const [min, max] = bounds
  const range = max - min
  const boundaries = [min]
  for (let i = 0; i < ratios.length - 1; i++) {
    boundaries.push(min + ratios[i] * range)
  }
  boundaries.push(max)
  return boundaries
}

export function getDiscreteStepValues(
  bounds: [number, number],
  ratios: readonly number[] = DEFAULT_BIN_RATIOS,
): number[] {
  const boundaries = calculateBinBoundaries(bounds, ratios)
  return boundaries.slice(1, -1)
}

export function getMapLibreStepValues(
  bounds: [number, number],
  ratios: readonly number[] = DEFAULT_BIN_RATIOS,
): number[] {
  const boundaries = calculateBinBoundaries(bounds, ratios)
  return boundaries.slice(1)
}

export function formatBinLabels(
  bounds: [number, number],
  ratios: readonly number[] = DEFAULT_BIN_RATIOS,
  unit: string = '',
): string[] {
  const boundaries = calculateBinBoundaries(bounds, ratios)
  const labels: string[] = []
  for (let i = 0; i < boundaries.length - 1; i++) {
    const lower = boundaries[i].toFixed(1)
    const upper = boundaries[i + 1].toFixed(1)
    labels.push(`${lower}-${upper}${unit}`)
  }
  return labels
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

export function useFireRiskColormap(
  options: Omit<ColormapOptions, 'mode'> = {},
): string[] {
  const [colorMode] = useColorMode()
  const mode = colorMode === 'dark' ? 'dark' : 'light'

  return useMemo(() => {
    return generateFireRiskColormap({ ...options, mode })
  }, [colorMode, options.count, options.format])
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
  }, [name, colorMode, options])
}
