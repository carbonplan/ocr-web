import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Map,
  addProtocol,
  removeProtocol,
  LayerSpecification,
  SourceSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { Box } from 'theme-ui'
import { useMapTheme } from '../hooks/useMapTheme'
import { useStore } from '../lib/store'
import {
  Buildings,
  SelectionMarker,
  GeographyLayer,
  WmsLayers,
  MapAttribution,
  useMapControlStyles,
} from './'
import { DATA_URLS, LAYERS } from '@/lib/config'
import { getMapViewFromQuery, updateMapViewUrl } from '@/lib/url-utils'

const MapComponent = () => {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useStore((state) => state.map)
  const setMap = useStore((state) => state.setMap)
  const satellite = useStore((state) => state.satellite)
  const setMapLoading = useStore((state) => state.setMapLoading)
  const sidebarWidth = useStore((state) => state.sidebarWidth)
  const [styleLoaded, setStyleLoaded] = useState(false)

  const mapLayers = useMapTheme()
  const mapControlStyles = useMapControlStyles()

  useEffect(() => {
    if (!mapContainer.current || !router.isReady) {
      return
    }
    setMapLoading(true)
    const protocol = new Protocol()
    addProtocol('pmtiles', protocol.tile)

    const initialView = getMapViewFromQuery(router.query) || {
      // Griffith Observatory, LA
      lat: 34.118,
      lng: -118.296,
      zoom: 14.5,
    }

    const sources: Record<string, SourceSpecification> = {
      basemap: {
        type: 'vector',
        url: 'pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/lower48.pmtiles',
        attribution:
          '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
      satellite: {
        type: 'raster',
        tiles: [`/api/map/tiles/{z}/{x}/{y}?style=satellite.day`],
        tileSize: 512,
        attribution: `&copy; ${new Date().getFullYear()} HERE Technologies`,
      },
      hillshadeSource: {
        type: 'raster-dem',
        tiles: [`/api/map/tiles/{z}/{x}/{y}?style=dem`],
        tileSize: 512,
        attribution: `&copy; ${new Date().getFullYear()} HERE Technologies`,
        maxzoom: 15,
      },
    }

    const layers: LayerSpecification[] = [
      {
        id: 'satellite',
        type: 'raster',
        source: 'satellite',
        paint: {
          'raster-saturation': -1,
          'raster-contrast': -0.5,
          'raster-opacity': 0.5,
        },
        layout: {
          visibility: 'none',
        },
      },
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'hillshadeSource',
        paint: {
          'hillshade-exaggeration': 0.08,
        },
      },
    ]

    const newMap = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs:
          'https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf',
        sources,
        layers: [...layers, ...mapLayers],
      },
      center: [initialView.lng, initialView.lat],
      zoom: initialView.zoom,
      maxBounds: [
        [-130, 10],
        [-60, 65],
      ],
      attributionControl: false,
      dragRotate: false,
      touchZoomRotate: false,
      pitchWithRotate: false,
    })

    const handleMoveEnd = () => {
      const center = newMap.getCenter()
      const zoom = newMap.getZoom()
      updateMapViewUrl({
        lat: center.lat,
        lng: center.lng,
        zoom: zoom,
      })
    }

    const handleLoadingOn = () => {
      if (!newMap.isStyleLoaded()) {
        setMapLoading(true)
      }
    }

    const handleLoadingOff = () => {
      setMapLoading(false)
    }

    const handleStyleLoad = () => {
      setStyleLoaded(true)
    }

    newMap.on('sourcedata', handleLoadingOn)
    newMap.on('idle', handleLoadingOff)
    newMap.on('moveend', handleMoveEnd)
    newMap.once('styledata', handleStyleLoad)

    setMap(newMap)

    return () => {
      newMap.off('sourcedata', handleLoadingOn)
      newMap.off('idle', handleLoadingOff)
      newMap.off('moveend', handleMoveEnd)
      newMap.remove()
      removeProtocol('pmtiles')
      setMap(null)
      setStyleLoaded(false)
    }
  }, [router.isReady])

  useEffect(() => {
    if (!map) return
    const currentStyle = map.getStyle()
    if (!currentStyle) return
    const newStyle = { ...currentStyle }
    map.setStyle(newStyle, { diff: true })
    const updateLayerProps = (layerId: string, spec: LayerSpecification) => {
      if (spec.paint) {
        for (const [key, value] of Object.entries(spec.paint)) {
          map.setPaintProperty(layerId, key, value)
        }
      }
    }
    mapLayers.forEach((layerSpec) => updateLayerProps(layerSpec.id, layerSpec))
  }, [mapLayers, map])

  useEffect(() => {
    if (!map) return
    if (map.getLayer('satellite')) {
      map.setLayoutProperty(
        'satellite',
        'visibility',
        satellite ? 'visible' : 'none',
      )
    }
    if (map.getLayer('water')) {
      map.setLayoutProperty(
        'water',
        'visibility',
        satellite ? 'none' : 'visible',
      )
    }
  }, [satellite, map])

  return (
    <Box
      ref={mapContainer}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: sidebarWidth,
        ...mapControlStyles,
      }}
    >
      {map && styleLoaded && (
        <>
          <MapAttribution />
          <WmsLayers />
          <GeographyLayer
            config={LAYERS.counties}
            geographyKey='county'
            environmentUrl={DATA_URLS.vector.counties}
          />
          <GeographyLayer
            config={LAYERS.censusTracts}
            geographyKey='censusTract'
            environmentUrl={DATA_URLS.vector.censusTracts}
          />
          <Buildings />
          <SelectionMarker />
        </>
      )}
    </Box>
  )
}

export default MapComponent
