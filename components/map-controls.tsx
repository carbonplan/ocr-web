import { useEffect, useState } from 'react'
import {
  AttributionControl,
  GeolocateControl,
  IControl,
  NavigationControl,
} from 'maplibre-gl'
import { get, useThemeUI, ThemeUIStyleObject } from 'theme-ui'
import { useStore } from '@/lib/store'

// stacked layers glyph; layers are filled with the button background so the
// top one occludes the bottom, and the top layer fills in while satellite is on
const satelliteIcon = (color: string, background: string, active: boolean) => {
  const c = encodeURIComponent(color)
  const bg = encodeURIComponent(background)
  return `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 8L2 14.5L12 21L22 14.5L12 8Z' fill='${bg}' stroke='${c}'/%3E%3Cpath d='M12 3L2 9.5L12 16L22 9.5L12 3Z' fill='${active ? c : bg}' stroke='${c}'/%3E%3C/svg%3E")`
}

export const useMapControlStyles = (): ThemeUIStyleObject => {
  const { theme } = useThemeUI()
  const primary = get(theme, 'rawColors.primary')
  const secondary = get(theme, 'rawColors.secondary')
  const hinted = get(theme, 'rawColors.hinted')

  return {
    '& .maplibregl-control-container': {
      textTransform: 'uppercase',
      fontSize: [0, 0, 1, 1],
      fontFamily: 'mono',
      letterSpacing: 'mono',
      '& [class*="maplibregl-ctrl-"]': { zIndex: 0 },
      '& .maplibregl-ctrl-attrib': {
        bottom: [135, 135, 'unset', 'unset'],
        bg: 'hinted',
        alignItems: 'center',
        border: `1px solid`,
        borderColor: 'secondary',
        color: 'primary',
        display: 'flex',
        '& a': { color: 'primary' },
        '& .maplibregl-ctrl-attrib-button': {
          bg: 'hinted',
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill-rule='evenodd' viewBox='0 0 20 20'%3E%3Cpath fill='${encodeURIComponent(primary)}' d='M4 10a6 6 0 1 0 12 0 6 6 0 1 0-12 0m5-3a1 1 0 1 0 2 0 1 1 0 1 0-2 0m0 3a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0'/%3E%3C/svg%3E")`,
          '&:hover, &:focus-visible': {
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill-rule='evenodd' viewBox='0 0 20 20'%3E%3Cpath fill='${encodeURIComponent(secondary)}' d='M4 10a6 6 0 1 0 12 0 6 6 0 1 0-12 0m5-3a1 1 0 1 0 2 0 1 1 0 1 0-2 0m0 3a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0'/%3E%3C/svg%3E")`,
          },
        },
      },
      '& .maplibregl-ctrl-group': {
        bg: 'hinted',
        border: `1px solid`,
        borderColor: 'secondary',
        borderRadius: '20px',
        boxShadow: 'none',
        marginBottom: [135, 135, '0px', '0px'],
        overflow: 'hidden',
        '&:has(.maplibregl-ctrl-geolocate), &:has(.maplibregl-ctrl-satellite)':
          {
            marginBottom: '10px',
          },
        '& button': {
          bg: 'hinted',
          border: 'none',
          borderBottom: `1px solid`,
          borderColor: 'secondary',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          '&:last-child': {
            borderBottom: 'none',
          },
          '& .maplibregl-ctrl-icon': {
            backgroundSize: '20px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          },
        },
        '& .maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon': {
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath stroke='${encodeURIComponent(primary)}' stroke-width='2' stroke-linecap='round' fill='none' d='M10 6v8M6 10h8'/%3E%3C/svg%3E")`,
        },
        '& .maplibregl-ctrl-zoom-in:hover .maplibregl-ctrl-icon, & .maplibregl-ctrl-zoom-in:focus-visible .maplibregl-ctrl-icon':
          {
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath stroke='${encodeURIComponent(secondary)}' stroke-width='2' stroke-linecap='round' fill='none' d='M10 6v8M6 10h8'/%3E%3C/svg%3E")`,
          },
        '& .maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon': {
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath stroke='${encodeURIComponent(primary)}' stroke-width='2' stroke-linecap='round' fill='none' d='M6 10h8'/%3E%3C/svg%3E")`,
        },
        '& .maplibregl-ctrl-zoom-out:hover .maplibregl-ctrl-icon, & .maplibregl-ctrl-zoom-out:focus-visible .maplibregl-ctrl-icon':
          {
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath stroke='${encodeURIComponent(secondary)}' stroke-width='2' stroke-linecap='round' fill='none' d='M6 10h8'/%3E%3C/svg%3E")`,
          },
        '& .maplibregl-ctrl-geolocate .maplibregl-ctrl-icon': {
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='3' fill='${encodeURIComponent(primary)}'/%3E%3Ccircle cx='10' cy='10' r='6' stroke='${encodeURIComponent(primary)}' stroke-width='1.5' fill='none'/%3E%3Cpath stroke='${encodeURIComponent(primary)}' stroke-width='1.5' stroke-linecap='round' d='M10 2v3M10 15v3M2 10h3M15 10h3'/%3E%3C/svg%3E")`,
        },
        '& .maplibregl-ctrl-geolocate:hover .maplibregl-ctrl-icon, & .maplibregl-ctrl-geolocate:focus-visible .maplibregl-ctrl-icon':
          {
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='3' fill='${encodeURIComponent(secondary)}'/%3E%3Ccircle cx='10' cy='10' r='6' stroke='${encodeURIComponent(secondary)}' stroke-width='1.5' fill='none'/%3E%3Cpath stroke='${encodeURIComponent(secondary)}' stroke-width='1.5' stroke-linecap='round' d='M10 2v3M10 15v3M2 10h3M15 10h3'/%3E%3C/svg%3E")`,
          },
        '& .maplibregl-ctrl-satellite .maplibregl-ctrl-icon': {
          backgroundImage: satelliteIcon(primary, hinted, false),
        },
        '& .maplibregl-ctrl-satellite:hover .maplibregl-ctrl-icon, & .maplibregl-ctrl-satellite:focus-visible .maplibregl-ctrl-icon':
          {
            backgroundImage: satelliteIcon(secondary, hinted, false),
          },
        '& .maplibregl-ctrl-satellite[aria-pressed="true"] .maplibregl-ctrl-icon':
          {
            backgroundImage: satelliteIcon(primary, hinted, true),
          },
        '& .maplibregl-ctrl-satellite[aria-pressed="true"]:hover .maplibregl-ctrl-icon, & .maplibregl-ctrl-satellite[aria-pressed="true"]:focus-visible .maplibregl-ctrl-icon':
          {
            backgroundImage: satelliteIcon(secondary, hinted, true),
          },
      },
    },
  }
}

class SatelliteControl implements IControl {
  private container: HTMLDivElement
  private button: HTMLButtonElement

  constructor(onClick: () => void) {
    this.container = document.createElement('div')
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    this.button = document.createElement('button')
    this.button.type = 'button'
    this.button.className = 'maplibregl-ctrl-satellite'
    this.button.addEventListener('click', onClick)
    const icon = document.createElement('span')
    icon.className = 'maplibregl-ctrl-icon'
    icon.setAttribute('aria-hidden', 'true')
    this.button.appendChild(icon)
    this.container.appendChild(this.button)
    this.setActive(false)
  }

  setActive(active: boolean) {
    const label = active ? 'Hide satellite imagery' : 'Show satellite imagery'
    this.button.setAttribute('aria-pressed', String(active))
    this.button.setAttribute('aria-label', label)
    this.button.title = label
  }

  onAdd() {
    return this.container
  }

  onRemove() {
    this.container.remove()
  }
}

const MapSatelliteControl = () => {
  const map = useStore((state) => state.map)
  const satellite = useStore((state) => state.satellite)
  const [control, setControl] = useState<SatelliteControl | null>(null)

  useEffect(() => {
    if (!map) return

    // read the latest value at click time rather than closing over it
    const satelliteControl = new SatelliteControl(() => {
      const { satellite, setSatellite } = useStore.getState()
      setSatellite(!satellite)
    })
    map.addControl(satelliteControl, 'bottom-right')
    setControl(satelliteControl)

    return () => {
      setControl(null)
      try {
        map.removeControl(satelliteControl)
      } catch (e) {
        console.error('Error removing satellite control:', e)
      }
    }
  }, [map])

  useEffect(() => {
    control?.setActive(satellite)
  }, [control, satellite])

  return null
}

const MapAttribution = () => {
  const map = useStore((state) => state.map)

  useEffect(() => {
    if (!map) return
    const attributionControl = new AttributionControl({ compact: true })
    map.addControl(attributionControl, 'bottom-right')
    return () => {
      try {
        if (!map) return
        map.removeControl(attributionControl)
      } catch (e) {
        console.error('Error removing attribution:', e)
      }
    }
  }, [map])

  return null
}

const MapGeolocateControl = () => {
  const map = useStore((state) => state.map)

  useEffect(() => {
    if (!map) return

    const geolocateControl = new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: false,
      },
      trackUserLocation: false,
      showUserLocation: false,
      fitBoundsOptions: {
        linear: true,
        maxZoom: 16,
      },
    })

    map.addControl(geolocateControl, 'bottom-right')

    return () => {
      try {
        if (!map) return
        map.removeControl(geolocateControl)
      } catch (e) {
        console.error('Error removing geolocate control:', e)
      }
    }
  }, [map])

  return null
}

const MapZoomControl = () => {
  const map = useStore((state) => state.map)

  useEffect(() => {
    if (!map) return

    const navigationControl = new NavigationControl({
      showCompass: false,
      visualizePitch: false,
    })

    map.addControl(navigationControl, 'bottom-right')

    return () => {
      try {
        if (!map) return
        map.removeControl(navigationControl)
      } catch (e) {
        console.error('Error removing zoom control:', e)
      }
    }
  }, [map])

  return null
}

const MapControls = () => {
  return (
    <>
      <MapAttribution />
      <MapZoomControl />
      <MapGeolocateControl />
      <MapSatelliteControl />
    </>
  )
}

export default MapControls
