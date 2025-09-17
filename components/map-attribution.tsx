import { useEffect } from 'react'
import { AttributionControl } from 'maplibre-gl'
import { get, useThemeUI } from 'theme-ui'
import { useStore } from '@/lib/store'

export const useMapControlStyles = () => {
  const { theme } = useThemeUI()
  const primary = get(theme, 'rawColors.primary')

  return {
    '.maplibregl-control-container': {
      textTransform: 'uppercase',
      fontSize: [0, 0, 1, 1],
      fontFamily: 'mono',
      letterSpacing: 'mono',
      '[class*="maplibregl-ctrl-"]': { zIndex: 0 },
      '& .maplibregl-ctrl-attrib': {
        bottom: [135, 135, 'unset', 'unset'],
        bg: 'hinted',
        color: 'primary',
        '& a': { color: 'primary' },
        '& .maplibregl-ctrl-attrib-button': {
          bg: 'hinted',
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill-rule='evenodd' viewBox='0 0 20 20'%3E%3Cpath fill='${encodeURIComponent(primary)}' d='M4 10a6 6 0 1 0 12 0 6 6 0 1 0-12 0m5-3a1 1 0 1 0 2 0 1 1 0 1 0-2 0m0 3a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0'/%3E%3C/svg%3E")`,
        },
      },
    },
  }
}

const MapAttribution = () => {
  const map = useStore((state) => state.map)
  useEffect(() => {
    if (!map) return
    const attributionControl = new AttributionControl({ compact: true })
    map.addControl(attributionControl, 'bottom-left')
    return () => {
      map.removeControl(attributionControl)
    }
  }, [map])

  return null
}

export default MapAttribution
