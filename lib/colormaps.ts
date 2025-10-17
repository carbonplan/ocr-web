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
  const start = '#4a2528'
  const mid = '#d55a5d'
  const end = '#fbfdab'
  const anchors = [start, mid, end]
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
