import { useEffect, useRef } from 'react'
import maplibregl, {
  FillLayerSpecification,
  RasterLayerSpecification,
  StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { useMapTheme } from '../hooks/useMapTheme'
import { useLocationStore } from '../store/location'
import { useThemeUI } from 'theme-ui'

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const { mapLayers, sprite } = useMapTheme()
  const selectedLocation = useLocationStore((state) => state.selectedLocation)
  const satellite = useLocationStore((state) => state.satellite)
  const { theme } = useThemeUI()

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
          sources: {
            protomaps: {
              type: 'vector',
              url: 'pmtiles://https://data.source.coop/protomaps/openstreetmap/v4.pmtiles', // TODO replace with carbonplan bucket
              attribution:
                '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
            },
            here: {
              type: 'raster',
              tiles: [`/api/map/tiles/{z}/{x}/{y}`],
              tileSize: 256,
            },
            buildings: {
              type: 'vector',
              url: 'pmtiles://https://carbonplan-scratch.s3.us-west-2.amazonaws.com/OCR/LA_region_coiled.pmtiles',
            },
          },
          layers: [], // Empty to start so we don't flash the wrong theme
        },
        center: [-118.2437, 34.0522],
        zoom: 9,
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

      const satelliteLayer: RasterLayerSpecification = {
        id: 'here',
        type: 'raster',
        source: 'here',
        paint: {
          'raster-saturation': -0.8,
        },
      }

      const buildingsLayer: FillLayerSpecification = {
        id: 'custom-buildings',
        type: 'fill',
        source: 'buildings',
        'source-layer': 'LA_regionfgb',
        paint: {
          'fill-color': '#85a2f7',
          'fill-opacity': 0.5,
        },
      }

      const newStyle: StyleSpecification = {
        ...existingStyle,
        layers: [
          ...(satellite ? [satelliteLayer] : []),
          buildingsLayer,
          ...mapLayers,
        ],
        sprite,
      }
      map.current.setStyle(newStyle)
    }

    if (map.current.isStyleLoaded()) {
      applyStyle()
    } else {
      map.current.once('style.load', applyStyle)
    }
  }, [mapLayers, sprite, satellite])

  useEffect(() => {
    if (!map.current || !selectedLocation) return
    const addressLocation = new maplibregl.LngLat(
      selectedLocation.position.lng,
      selectedLocation.position.lat,
    )
    map.current.flyTo({
      center: addressLocation,
      zoom: 17,
      offset: [250, 0], // TODO: make dynamic w/ sidebar width
    })
  }, [selectedLocation])

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
