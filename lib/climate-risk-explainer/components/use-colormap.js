import chroma from 'chroma-js'
import { useMemo } from 'react'
import { useColorMode } from 'theme-ui'

export const BIN_BOUNDARIES = [0, 0.01, 0.02, 0.035, 0.06, 0.1, 0.2, 0.5, 1, 3]

function generateColormap(options) {
  const { count, mode = 'dark' } = options

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

export function useColormap(options) {
  const [colorMode] = useColorMode()
  const mode = colorMode === 'dark' ? 'dark' : 'light'

  return useMemo(() => {
    return generateColormap({ mode, count: BIN_BOUNDARIES.length, ...options })
  }, [options, mode])
}

export function useColormapRGB(options) {
  const hexColors = useColormap(options)

  return useMemo(() => {
    return hexColors.map((c) => chroma(c).rgb())
  }, [hexColors])
}
