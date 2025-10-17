import chroma from 'chroma-js'
import { useMemo } from 'react'
import { useColorMode } from 'theme-ui'
import { useStore } from './store'

export interface ColormapOptions {
  count?: number
  mode?: 'light' | 'dark'
}

export function generateFireRiskColormap(
  options: ColormapOptions = {},
): string[] {
  const { count = 10, mode = 'dark' } = options
  // original pallette created: https://gka.github.io/palettes/#/10|s|4a2528,d55a5d,fbfdab|ffffe0,ff005e,93003a|1|1
  // https://gka.github.io/palettes/#/10|s|542c24,ff0000,ffffb2|ffffe0,ff005e,93003a|1|1

  return [
    '#542c24',
    '#7e3322',
    '#a13e25',
    '#bf502c',
    '#d86638',
    '#ec8149',
    '#fb9e5e',
    '#ffbf78',
    '#ffdf94',
    '#ffffb2',
  ]

  const red = chroma('#f57273')
  const orange = chroma('#e39046')
  const yellow = chroma('#d4c05e')

  const first = chroma.mix(red, chroma('#1b1e23'), 0.6, 'lab').hex()
  const mid = orange
  const end = yellow.brighten(2)

  const anchors = [first, mid, end]
  const colors = chroma
    .bezier(anchors)
    .scale()
    .correctLightness(true)
    .colors(count, 'hex')
  return mode === 'dark' ? colors : [...colors].reverse()
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

export function useColormap(options?: ColormapOptions): string[] {
  const [colorMode] = useColorMode()
  const colormap = useStore((state) => state.riskConfig.colormap)
  const count = useStore((state) =>
    state.colorLimits.type === 'discrete'
      ? state.colorLimits.binBoundaries.length
      : (options?.count ?? 256),
  )
  const mode = colorMode === 'dark' ? 'dark' : 'light'

  return useMemo(() => {
    return generateColormap(colormap, { ...options, mode, count })
  }, [colormap, options, mode, count])
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
