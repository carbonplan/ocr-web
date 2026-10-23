import { useEffect } from 'react'
import type { GeoJSONSource } from 'maplibre-gl'
import { useThemeUI, get } from 'theme-ui'
import { useStore } from '@/lib/store'
import { LAYERS } from '@/lib/config'
import { getRegionGeometry } from '@/lib/region-lookup'
import { getGeoid } from '@/lib/risk-utils'

const RegionHighlight = () => {
  const { theme } = useThemeUI()
  const map = useStore((state) => state.map)
  const selectedGeographyLevel = useStore(
    (state) => state.selectedGeographyLevel,
  )
  const showGeographyHighlight = useStore(
    (state) => state.showGeographyHighlight,
  )
  const geoid = useStore((state) =>
    getGeoid(state.activeGeographies[selectedGeographyLevel]),
  )

  useEffect(() => {
    const source = map?.getSource<GeoJSONSource>(
      LAYERS.regionHighlight.sourceId,
    )
    if (!source) return
    const geometry =
      showGeographyHighlight && geoid
        ? getRegionGeometry(selectedGeographyLevel, geoid)
        : null
    source.setData({
      type: 'FeatureCollection',
      features: geometry ? [{ type: 'Feature', geometry, properties: {} }] : [],
    })
  }, [map, selectedGeographyLevel, showGeographyHighlight, geoid])

  useEffect(() => {
    if (!map?.getLayer(LAYERS.regionHighlight.layerIds.line)) return
    map.setPaintProperty(
      LAYERS.regionHighlight.layerIds.line,
      'line-color',
      get(theme, 'rawColors.primary'),
    )
  }, [map, theme])

  return null
}

export default RegionHighlight
