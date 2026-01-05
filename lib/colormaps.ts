import { useColorMode, useThemeUI } from 'theme-ui'
// @ts-expect-error - carbonplan colormaps types not available
import { useColormap as useColormapBase } from '@carbonplan/colormaps'
import { useMemo } from 'react'
import { mix } from '@theme-ui/color'
import { useStore } from './store'

export interface ColormapOptions {
  count?: number
  mode?: 'light' | 'dark'
  format?: 'rgb' | 'hex'
}

const OFFSET = 1

export function useColormap(options?: ColormapOptions): string[] {
  const colormap = useStore((state) => state.riskConfig.colormap)
  const count = useStore((state) => state.colorLimits.binBoundaries.length)
  const [colorMode] = useColorMode()
  const { theme } = useThemeUI()
  const mode = colorMode === 'dark' ? 'dark' : 'light'
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
