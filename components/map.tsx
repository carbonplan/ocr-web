import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { layers, namedFlavor } from '@protomaps/basemaps'

const flavorName = 'black'
const carbonPlanDark = {
  ...namedFlavor(flavorName),
  buildings: '#00000000',
  background: '#1b1e23',
  earth: '#1b1e23',
  park_a: '#1b1e23',
  park_b: '#1b1e23',
  golf_course: '#1b1e23',
  aerodrome: '#1b1e23',
  industrial: '#1b1e23',
  university: '#1b1e23',
  school: '#1b1e23',
  zoo: '#1b1e23',
  farmland: '#1b1e23',
  wood_a: '#1b1e23',
  wood_b: '#1b1e23',
  residential: '#1b1e23',
  protected_area: '#1b1e23',
  scrub_a: '#1b1e23',
  scrub_b: '#1b1e23',

  regular: 'Relative Pro Book',
  bold: 'Relative Pro Book',
  italic: 'Relative Pro Book',
}
const language = 'en'

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (map.current) return

    if (mapContainer.current) {
      let protocol = new Protocol()
      maplibregl.addProtocol('pmtiles', protocol.tile)
      const mapLayers = layers('protomaps', carbonPlanDark, { lang: language })

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          glyphs:
            'https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf',
          sprite: `https://protomaps.github.io/basemaps-assets/sprites/v4/${flavorName}`,
          sources: {
            protomaps: {
              type: 'vector',
              url: 'pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/mn.pmtiles',
              attribution:
                '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
            },
          },
          layers: mapLayers,
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
