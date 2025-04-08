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

const buildingSource =
  'https://carbonplan-ocr.s3.us-west-2.amazonaws.com/intermediate/fire-risk/vector/CA_12_risk_scores.pmtiles'
const buildingsLayer = 'CA_12_risk_scoresfgb'

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const { mapLayers, sprite } = useMapTheme()
  const selectedLocation = useLocationStore((state) => state.selectedLocation)
  const setSelectedLocation = useLocationStore(
    (state) => state.setSelectedLocation,
  )
  const satellite = useLocationStore((state) => state.satellite)
  const setSelectedBuilding = useLocationStore(
    (state) => state.setSelectedBuilding,
  )
  const { theme } = useThemeUI()
  const isUserClick = useRef(false)

  const setPointerCursor = () => {
    if (map.current) {
      map.current.getCanvas().style.cursor = 'pointer'
    }
  }

  const resetCursor = () => {
    if (map.current) {
      map.current.getCanvas().style.cursor = ''
    }
  }

  const highlightBuildingAtLocation = (lng: number, lat: number) => {
    if (
      !map.current?.getSource('buildings') ||
      !map.current?.getLayer('custom-buildings-fill')
    ) {
      return
    }

    map.current.removeFeatureState({
      source: 'buildings',
      sourceLayer: buildingsLayer,
    })

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
            sourceLayer: buildingsLayer,
          },
          { highlighted: true },
        )
      }
    }
  }

  const handleBuildingClick = async (e: maplibregl.MapMouseEvent) => {
    if (!map.current) return

    const features = map.current.queryRenderedFeatures(e.point, {
      layers: ['custom-buildings-fill'],
    })

    if (features.length > 0) {
      setSelectedBuilding(features[0].properties)
      const feature = features[0]
      const { lng, lat } = e.lngLat
      isUserClick.current = true
      if (feature.id) {
        map.current.removeFeatureState({
          source: 'buildings',
          sourceLayer: buildingsLayer,
        })

        map.current.setFeatureState(
          {
            source: 'buildings',
            id: feature.id,
            sourceLayer: buildingsLayer,
          },
          { highlighted: true },
        )

        try {
          const response = await fetch(
            `/api/geocode/reverse?lat=${lat}&lng=${lng}`,
          )
          if (response.ok) {
            const location = await response.json()
            setSelectedLocation(location)
          }
        } catch (error) {
          console.error('Error fetching location details:', error)
        }
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
              url: 'pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/lower48.pmtiles',
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
              url: `pmtiles://${buildingSource}`,
            },
          },
          layers: [], // Empty to start so we don't flash the wrong theme
        },
        center: [-118.2437, 34.0522],
        zoom: 9,
      })

      map.current.on('click', 'custom-buildings-fill', handleBuildingClick)

      map.current.on('mouseenter', 'custom-buildings-fill', setPointerCursor)
      map.current.on('mouseleave', 'custom-buildings-fill', resetCursor)
    }

    return () => {
      if (map.current) {
        map.current.off('click', 'custom-buildings-fill', handleBuildingClick)
        map.current.off('mouseenter', 'custom-buildings-fill', setPointerCursor)
        map.current.off('mouseleave', 'custom-buildings-fill', resetCursor)
      }
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
        'source-layer': buildingsLayer,
        minzoom: 15,
        paint: {
          'fill-color': '#85a2f7',
          'fill-opacity': 0.5,
        },
      }

      const buildingsLineLayer: LineLayerSpecification = {
        id: 'custom-buildings-line',
        type: 'line',
        source: 'buildings',
        'source-layer': buildingsLayer,
        minzoom: 15,
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

    if (!isUserClick.current) {
      const addressLocation = new maplibregl.LngLat(
        selectedLocation.position.lng,
        selectedLocation.position.lat,
      )
      map.current.flyTo({
        center: addressLocation,
        zoom: selectedLocation.address.houseNumber ? 17 : 12,
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
    }

    isUserClick.current = false
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
