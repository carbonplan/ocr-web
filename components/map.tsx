import { useEffect, useRef } from 'react'
import { useThemeUI } from 'theme-ui'
import maplibregl, {
  FillLayerSpecification,
  LineLayerSpecification,
  RasterLayerSpecification,
  StyleSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { useMapTheme } from '../hooks/useMapTheme'
import { useLocationStore } from '../store/location'

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const { mapLayers, sprite } = useMapTheme()
  const selectedLocation = useLocationStore((state) => state.selectedLocation)
  const satellite = useLocationStore((state) => state.satellite)
  const { theme } = useThemeUI()

  const highlightBuildingAtLocation = (lng: number, lat: number) => {
    if (
      !map.current?.getSource('buildings') ||
      !map.current?.getLayer('custom-buildings-fill')
    ) {
      return
    }
    const point = map.current.project([lng, lat])
    const features = map.current.queryRenderedFeatures(point, {
      layers: ['custom-buildings-fill'],
    })

    if (features.length > 0) {
      const buildingFeature = features[0]
      if (buildingFeature.id) {
        map.current.setFeatureState(
          {
            source: 'buildings',
            id: buildingFeature.id,
            sourceLayer: 'LA_regionfgb',
          },
          { highlighted: true },
        )
      }
    }
  }

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

      const buildingsFillLayer: FillLayerSpecification = {
        id: 'custom-buildings-fill',
        type: 'fill',
        source: 'buildings',
        'source-layer': 'LA_regionfgb',
        paint: {
          'fill-color': '#85a2f7',
          'fill-opacity': 0.5,
        },
      }

      const buildingsLineLayer: LineLayerSpecification = {
        id: 'custom-buildings-line',
        type: 'line',
        source: 'buildings',
        'source-layer': 'LA_regionfgb',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'highlighted'], false],
            theme?.rawColors?.primary as string,
            'transparent',
          ],
          'line-width': 3,
        },
      }

      const newStyle: StyleSpecification = {
        ...existingStyle,
        layers: [
          ...(satellite ? [satelliteLayer] : []),
          buildingsFillLayer,
          buildingsLineLayer,
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
    if (!map.current || !selectedLocation || !map.current.isStyleLoaded())
      return
    map.current.removeFeatureState({
      source: 'buildings',
      sourceLayer: 'LA_regionfgb',
    })

    const addressLocation = new maplibregl.LngLat(
      selectedLocation.position.lng,
      selectedLocation.position.lat,
    )
    map.current.flyTo({
      center: addressLocation,
      zoom: 17,
      offset: [250, 0], // TODO: make dynamic w/ sidebar width
    })

    const handleMoveEnd = () => {
      highlightBuildingAtLocation(
        selectedLocation.position.lng,
        selectedLocation.position.lat,
      )
    }

    map.current.once('moveend', handleMoveEnd)
    return () => {
      if (map.current) {
        map.current.off('moveend', handleMoveEnd)
      }
    }
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
