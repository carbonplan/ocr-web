import { useEffect, useRef } from 'react'
import {
  StyleSpecification,
  Map,
  addProtocol,
  removeProtocol,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { useMapTheme } from '../hooks/useMapTheme'
import { useLocationStore } from '../store/location'
import { Buildings } from './'

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null) // ref for cleanup
  const map = useLocationStore((state) => state.map)
  const setMap = useLocationStore((state) => state.setMap)
  const satellite = useLocationStore((state) => state.satellite)
  const riskRaster = useLocationStore((state) => state.riskRaster)
  const { mapLayers, sprite } = useMapTheme()

  useEffect(() => {
    if (mapContainer.current) {
      const protocol = new Protocol()
      addProtocol('pmtiles', protocol.tile)

      const newMap = new Map({
        container: mapContainer.current,
        style: {
          version: 8,
          glyphs:
            'https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf',
          sources: {
            basemap: {
              type: 'vector',
              url: 'pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/lower48.pmtiles',
              attribution:
                '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
            },
            satellite: {
              type: 'raster',
              tiles: [`/api/map/tiles/{z}/{x}/{y}`],
              tileSize: 256,
            },
          },
          layers: [
            {
              id: 'satellite',
              type: 'raster',
              source: 'satellite',
              paint: {
                'raster-saturation': -0.8,
                'raster-opacity': 0.5,
              },
              layout: {
                visibility: 'none',
              },
            },
          ],
        },
        center: [-121.3, 47.70818],
        zoom: 8,
      })
      setMap(newMap)
      mapRef.current = newMap
    }

    return () => {
      removeProtocol('pmtiles')
      mapRef.current?.remove()
      setMap(null)
    }
  }, [])

  useEffect(() => {
    const applyStyle = () => {
      if (!map) return
      const existingStyle = map.getStyle()
      const specialLayers = existingStyle.layers.filter(
        (layer) =>
          layer.id === 'satellite' || layer.id.startsWith('buildings-'),
      )
      const newLayers = [...specialLayers, ...mapLayers]

      const newStyle: StyleSpecification = {
        ...existingStyle,
        layers: newLayers,
        sprite,
      }
      map.setStyle(newStyle)
    }
    if (!map || !map.getStyle()) {
      map?.once('style.load', applyStyle)
    } else {
      applyStyle()
    }
  }, [mapLayers, sprite, map])

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return
    map.setLayoutProperty(
      'satellite',
      'visibility',
      satellite ? 'visible' : 'none',
    )
  }, [satellite, map])

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <Buildings />
    </div>
  )
}

export default MapComponent
