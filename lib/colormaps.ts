import chroma from 'chroma-js'
import { useColorMode, useThemeUI } from 'theme-ui'
// @ts-expect-error - carbonplan colormaps types not available
import { useColormap as useColormapBase } from '@carbonplan/colormaps'
import { useMemo } from 'react'
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
  const [colorMode] = useColorMode()
  const { mode, ...others } = options ?? {}
  const colormapBase = useColormapBase(colormap, {
    mode: 'light',
    format: 'hex',
    ...others,
    count: count + OFFSET,
  })

  let muted: string, background: string
  const isLight = mode ? mode === 'light' : colorMode === 'light'
  if (isLight) {
    muted = theme.rawColors?.modes?.light.muted as string
    background = theme.rawColors?.modes?.light.background as string
  } else {
    muted = theme.rawColors?.muted as string
    background = theme.rawColors?.background as string
  }

  const res = useMemo(
    () => [
      chroma(muted).mix(background, 0.3).hex(),
      ...colormapBase.slice(OFFSET).map((c: string, i: number) =>
        chroma(background)
          .mix(c, Math.min(0.4 + i * 0.1, 1))
          .hex(),
      ),
    ],
    [colormapBase, muted, background],
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
