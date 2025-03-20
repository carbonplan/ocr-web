import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { useMapTheme } from '../utils/styles'

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const { mapLayers, sprite } = useMapTheme()

  useEffect(() => {
    if (map.current) return

    if (mapContainer.current) {
      let protocol = new Protocol()
      maplibregl.addProtocol('pmtiles', protocol.tile)

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          glyphs:
            'https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf',
          // sprite,
          sources: {
            protomaps: {
              type: 'vector',
              url: 'pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/mn.pmtiles',
              attribution:
                '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
            },
          },
          layers: [], // Empty to start so we don't flash the wrong theme
        },
        center: [-94, 45],
        zoom: 8,
      })
    }

    return () => {
      maplibregl.removeProtocol('pmtiles')
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current) return
    const applyStyle = () => {
      if (!map.current) return
      const existingStyle = map.current.getStyle()
      const newStyle = {
        ...existingStyle,
        layers: mapLayers,
        sprite,
      }
      map.current.setStyle(newStyle)
    }
    if (map.current.isStyleLoaded()) {
      applyStyle()
    } else {
      map.current.once('style.load', applyStyle)
    }
  }, [mapLayers, sprite])

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  )
}

export default Map
