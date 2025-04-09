import { useColorMode } from 'theme-ui'
import { layers, namedFlavor } from '@protomaps/basemaps'

const language = 'en'

export const useMapTheme = () => {
  const [colorMode] = useColorMode()
  const isDark = colorMode === 'dark'
  const flavorName = isDark ? 'black' : 'white'
  const backgroundColor = '#00000000'
  const sprite = `https://protomaps.github.io/basemaps-assets/sprites/v4/${flavorName}`

  const mapTheme = {
    ...namedFlavor(flavorName),
    buildings: backgroundColor,
    background: backgroundColor,
    earth: backgroundColor,
    park_a: backgroundColor,
    park_b: backgroundColor,
    golf_course: backgroundColor,
    aerodrome: backgroundColor,
    industrial: backgroundColor,
    university: backgroundColor,
    school: backgroundColor,
    zoo: backgroundColor,
    farmland: backgroundColor,
    wood_a: backgroundColor,
    wood_b: backgroundColor,
    residential: backgroundColor,
    protected_area: backgroundColor,
    scrub_a: backgroundColor,
    scrub_b: backgroundColor,
    landcover: {
      barren: backgroundColor,
      farmland: backgroundColor,
      forest: backgroundColor,
      glacier: backgroundColor,
      grassland: backgroundColor,
      scrub: backgroundColor,
      urban_area: backgroundColor,
    },
    regular: 'Relative Pro Book',
    bold: 'Relative Pro Book',
    italic: 'Relative Pro Book',
  }
  const mapLayers = layers('basemap', mapTheme, { lang: language })
  return {
    mapLayers,
    sprite,
  }
}
