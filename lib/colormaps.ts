import chroma from 'chroma-js'
import { useThemeUI } from 'theme-ui'
// @ts-expect-error - carbonplan colormaps types not available
import { useColormap as useColormapBase } from '@carbonplan/colormaps'
import { useMemo } from 'react'
import { mix } from '@theme-ui/color'
import { useStore } from './store'

export interface ColormapOptions {
  count?: number
  mode?: 'light' | 'dark'
}

const OFFSET = 1

export function useColormap(options?: ColormapOptions): string[] {
  const colormap = useStore((state) => state.riskConfig.colormap)
  const count = useStore((state) => state.colorLimits.binBoundaries.length)
  const { theme } = useThemeUI()
  const colormapBase = useColormapBase(colormap, {
    mode: 'light',
    format: 'hex',
    ...options,
    count: count + OFFSET,
  })

  const res = useMemo(
    () =>
      [
        mix('muted', 'background', 0.3)(theme),
        ...colormapBase
          .slice(OFFSET)
          .map((c: string, i: number) => chroma(c).alpha(0.4 + i * 0.1)),
      ].map((c) => chroma(c).hex()),
    [colormapBase, theme],
  )

  return res
}

export function useColormapRGB(
  options?: ColormapOptions,
): [number, number, number][] {
  const hexColors = useColormap(options)
  return useMemo(() => {
    return hexColors.map((c) => chroma(c).rgb())
  }, [hexColors])
}
