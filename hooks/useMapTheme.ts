import { useColorMode, useThemeUI, get } from 'theme-ui'
import { useMemo } from 'react'
import { Flavor, layers, namedFlavor } from '@protomaps/basemaps'

const language = 'en'

export const useMapTheme = () => {
  const [colorMode] = useColorMode()
  const { theme } = useThemeUI()
  const isDark = colorMode === 'dark'
  const flavorName = isDark ? 'black' : 'white'
  const transparent = 'transparent'
  const hinted = get(theme, 'rawColors.hinted')
  const primary = get(theme, 'rawColors.primary')
  const secondary = get(theme, 'rawColors.secondary')
  const muted = get(theme, 'rawColors.muted')
  const background = get(theme, 'rawColors.background')

  const sprite = useMemo(
    () =>
      `https://protomaps.github.io/basemaps-assets/sprites/v4/${flavorName}`,
    [flavorName],
  )

  const mapTheme: Flavor = useMemo(
    () => ({
      ...namedFlavor(flavorName),
      buildings: transparent,
      background: transparent,
      park_a: transparent,
      park_b: transparent,
      hospital: transparent,
      industrial: transparent,
      school: transparent,
      wood_a: transparent,
      wood_b: transparent,
      pedestrian: transparent,
      scrub_a: transparent,
      scrub_b: transparent,
      glacier: transparent,
      sand: transparent,
      beach: transparent,
      aerodrome: transparent,
      runway: transparent,
      earth: transparent,
      zoo: transparent,
      military: transparent,

      landcover: {
        barren: transparent,
        farmland: transparent,
        forest: transparent,
        glacier: transparent,
        grassland: transparent,
        scrub: transparent,
        urban_area: transparent,
      },

      water: hinted,

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
      pier: muted,

      railway: muted,
      boundaries: secondary,

      roads_label_minor: secondary,
      roads_label_minor_halo: background,
      roads_label_major: secondary,
      roads_label_major_halo: background,
      ocean_label: secondary,
      subplace_label: [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        secondary,
        22,
        primary,
      ],
      subplace_label_halo: background,
      city_label: [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        secondary,
        22,
        primary,
      ],
      city_label_halo: background,
      state_label: secondary,
      state_label_halo: background,
      country_label: secondary,

      address_label: secondary,
      address_label_halo: background,

      regular: 'Relative Pro Book',
      bold: 'Relative Pro Book',
      italic: 'Relative Pro Book',
    }),
    [flavorName, hinted, secondary, muted, background, primary],
  )

  const mapLayers = useMemo(
    () => layers('basemap', mapTheme, { lang: language }),
    [mapTheme],
  )
  return {
    mapLayers,
    sprite,
  }
}
