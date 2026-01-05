import { useColorMode } from 'theme-ui'
// @ts-expect-error - carbonplan colormaps types not available
import { useColormap as useColormapBase } from '@carbonplan/colormaps'
import { useStore } from './store'
import { useMemo } from 'react'

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
  const mode = colorMode === 'dark' ? 'dark' : 'light'
  const colormapBase = useColormapBase(colormap, {
    mode,
    format: 'hex',
    ...options,
    count: count + OFFSET,
  })

  return useMemo(() => colormapBase.slice(OFFSET), [colormapBase])
}
