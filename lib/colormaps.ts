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

  const red = '#f57273'
  const orange = '#e39046'
  const first = chroma.mix(red, chroma('#1b1e23'), 0.5, 'lab').hex()
  const colors = chroma
    .bezier([first, red, 'ef6200', orange, 'fdff88'])
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
