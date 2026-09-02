import chroma from 'chroma-js'
import { useColorMode, useThemeUI } from 'theme-ui'
// @ts-expect-error - carbonplan colormaps types not available
import { useColormap as useColormapBase } from '@carbonplan/colormaps'
import { useMemo } from 'react'
import { mix } from '@theme-ui/color'
import { useStore } from './store'

export interface ColormapOptions {
  count?: number
  mode?: 'light' | 'dark'
}

const OFFSET = 2

export function useColormap(options?: ColormapOptions): string[] {
  const colormap = useStore((state) => state.riskConfig.colormap)
  const displayCount = useStore(
    (state) => state.colorLimits.binBoundaries.length,
  )
  const [colorMode] = useColorMode()
  const { theme } = useThemeUI()
  const mode = colorMode === 'dark' ? 'dark' : 'light'
  // sized to the displayed layer's bins unless a caller is coloring against a
  // different set (e.g. risk scores while another layer is on the map)
  const count = options?.count ?? displayCount
  const colormapBase = useColormapBase(colormap, {
    mode,
    format: 'hex',
    ...options,
    count: count + OFFSET,
  })

  return useMemo(
    () => [
      mix('muted', 'background', 0.3)(theme),
      ...colormapBase.slice(OFFSET),
    ],
    [colormapBase, theme],
  )
}

export function useColormapRGB(
  options?: ColormapOptions,
): [number, number, number][] {
  const hexColors = useColormap(options)
  return useMemo(() => {
    return hexColors.map((c) => chroma(c).rgb())
  }, [hexColors])
}
