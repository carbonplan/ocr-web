import chroma from 'chroma-js'
import { useMemo } from 'react'
import { useColorMode } from 'theme-ui'

const useMakeColormap = (options = {}) => {
  const [colorMode] = useColorMode()
  const { format = 'rgb' } = options
  const count = 100
  const mode = colorMode === 'dark' ? 'dark' : 'light'

  return useMemo(() => {
    const red = '#f57273'
    const orange = '#e39046'
    const start = mode === 'dark' ? chroma('#1b1e23') : chroma('#ebebec')

    let ramp

    if (mode === 'dark') {
      ramp = [
        start,
        chroma(red).darken(1),
        chroma.mix(red, orange, 0.45, 'lab').darken(0.5),
        chroma(orange),
        chroma(orange).brighten(0.5),
      ]
    }
    if (mode === 'light') {
      ramp = [
        start,
        chroma(orange).brighten(1),
        chroma.mix(orange, red, 0.25, 'lab').brighten(0.5),
        chroma(red),
        chroma(red).darken(0.5),
      ]
    }

    const colors = chroma
      .scale(ramp)
      .domain([0, 0.05, 0.34, 0.67, 1])
      .colors(count, format)
    return colors
  }, [mode, format])
}

export default useMakeColormap
