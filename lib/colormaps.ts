import chroma from 'chroma-js'
import { useMemo } from 'react'
import { useColorMode } from 'theme-ui'
import { useStore } from './store'

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
  const colormap = useStore((state) => state.riskConfig.colormap)
  const count = useStore((state) =>
    state.colorLimits.type === 'discrete'
      ? state.colorLimits.binBoundaries.length
      : 256,
  )
  const mode = colorMode === 'dark' ? 'dark' : 'light'

  return useMemo(() => {
    return generateColormap(colormap, { ...options, mode, count })
  }, [colormap, options, mode, count])
}
