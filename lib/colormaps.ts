import chroma from 'chroma-js'
import { useColorMode, useThemeUI } from 'theme-ui'
// @ts-expect-error - carbonplan colormaps types not available
import { useColormap as useColormapBase } from '@carbonplan/colormaps'
import { useMemo } from 'react'
import { mix } from '@theme-ui/color'
import { useStore } from './store'
import { getMapLayer } from './hazards'

export interface ColormapOptions {
  count?: number
  mode?: 'light' | 'dark'
  // defaults to the displayed layer's colormap
  name?: string
  // with `name`, samples the whole ramp as a continuous layer does; defaults
  // to the displayed layer's
  continuous?: boolean
}

const OFFSET = 2

export function useColormap(options?: ColormapOptions): string[] {
  const layerColormap = useStore(
    (state) =>
      getMapLayer(state.riskConfig, state.mapLayer)?.colormap ??
      state.riskConfig.colormap,
  )
  const layerContinuous = useStore(
    (state) => !!getMapLayer(state.riskConfig, state.mapLayer)?.continuous,
  )
  const { name, continuous: continuousOption, ...baseOptions } = options ?? {}
  const colormap = name ?? layerColormap
  const continuous = continuousOption ?? (!name && layerContinuous)
  const displayCount = useStore(
    (state) => state.colorLimits.binBoundaries.length,
  )
  const [colorMode] = useColorMode()
  const { theme } = useThemeUI()
  const mode = colorMode === 'dark' ? 'dark' : 'light'
  // sized to the displayed layer's bins unless a caller is coloring against a
  // different set (e.g. risk scores while another layer is on the map)
  // continuous layers sample the whole ramp, ends included, so a diverging
  // ramp stays centered; binned ones drop the palest samples
  const count = continuous ? 255 : (baseOptions.count ?? displayCount)
  const offset = continuous ? 0 : OFFSET
  const colormapBase = useColormapBase(colormap, {
    mode,
    format: 'hex',
    ...baseOptions,
    count: count + offset,
  })

  return useMemo(
    () => [
      mix('muted', 'background', 0.3)(theme),
      ...colormapBase.slice(offset),
    ],
    [colormapBase, theme, offset],
  )
}

// A value's color on a continuous colormap from useColormap, as the raster
// shader samples it: clamped to [lo, hi], past the leading no-data swatch
export function getContinuousColor(
  colormap: string[],
  [lo, hi]: [number, number],
  value: number,
): string {
  const t = Math.min(1, Math.max(0, (value - lo) / (hi - lo)))
  return colormap[Math.round(1 + t * (colormap.length - 2))]
}

export function useColormapRGB(
  options?: ColormapOptions,
): [number, number, number][] {
  const hexColors = useColormap(options)
  return useMemo(() => {
    return hexColors.map((c) => chroma(c).rgb())
  }, [hexColors])
}
