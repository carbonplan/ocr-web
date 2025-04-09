import { useColorMode, useThemeUI } from 'theme-ui'
import { Flavor, layers, namedFlavor } from '@protomaps/basemaps'

const language = 'en'

export const useMapTheme = () => {
  const [colorMode] = useColorMode()
  const { theme } = useThemeUI()
  const isDark = colorMode === 'dark'
  const flavorName = isDark ? 'black' : 'white'
  const transparent = 'transparent'
  const secondary = theme?.rawColors?.secondary as string
  const muted = theme?.rawColors?.muted as string
  const background = theme?.rawColors?.background as string

  const sprite = `https://protomaps.github.io/basemaps-assets/sprites/v4/${flavorName}`
  const mapTheme: Flavor = {
    ...namedFlavor(flavorName),
    buildings: transparent,
    background: transparent,
    water: muted,
    earth: transparent,
    park_a: transparent,
    park_b: transparent,
    aerodrome: transparent,
    industrial: transparent,
    school: transparent,
    zoo: transparent,
    wood_a: transparent,
    wood_b: transparent,
    scrub_a: transparent,
    scrub_b: transparent,

    bridges_other_casing: background,
    bridges_minor_casing: background,
    bridges_link_casing: background,
    bridges_major_casing: background,
    bridges_highway_casing: background,
    bridges_other: muted,
    bridges_minor: muted,
    bridges_link: muted,
    bridges_major: muted,
    bridges_highway: muted,

    minor_service_casing: background,
    minor_casing: background,
    link_casing: background,
    major_casing_late: background,
    highway_casing_late: background,
    other: muted,
    minor_service: muted,
    minor_a: muted,
    minor_b: muted,
    link: muted,
    major_casing_early: background,
    major: muted,
    highway_casing_early: background,
    highway: muted,

    railway: muted,
    boundaries: secondary,

    roads_label_minor: secondary,
    roads_label_minor_halo: background,
    roads_label_major: secondary,
    roads_label_major_halo: background,
    ocean_label: secondary,
    subplace_label: secondary,
    subplace_label_halo: background,
    city_label: secondary,
    city_label_halo: background,
    state_label: secondary,
    state_label_halo: background,
    country_label: secondary,

    address_label: secondary,
    address_label_halo: background,

    landcover: {
      barren: transparent,
      farmland: transparent,
      forest: transparent,
      glacier: transparent,
      grassland: transparent,
      scrub: transparent,
      urban_area: transparent,
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
