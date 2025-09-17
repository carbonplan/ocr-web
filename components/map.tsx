import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Map,
  addProtocol,
  removeProtocol,
  LayerSpecification,
  SourceSpecification,
  AttributionControl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { Box } from 'theme-ui'
import { useMapTheme } from '../hooks/useMapTheme'
import { useStore } from '../lib/store'
import { Buildings, GeographyLayer, WmsLayers } from './'
import { DATA_URLS, LAYERS } from '@/lib/config'
import { getMapViewFromQuery, updateMapViewUrl } from '@/lib/url-utils'

const MapComponent = () => {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useStore((state) => state.map)
  const setMap = useStore((state) => state.setMap)
  const satellite = useStore((state) => state.satellite)
  const setMapLoading = useStore((state) => state.setMapLoading)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const sidebarWidth = useStore((state) => state.sidebarWidth)

  const mapLayers = useMapTheme()

  useEffect(() => {
    if (!mapContainer.current || !router.isReady) {
      return
    }
    setMapLoading(true)
    const protocol = new Protocol()
    addProtocol('pmtiles', protocol.tile)

    const initialView = getMapViewFromQuery(router.query) || {
      lat: 47.7,
      lng: -121.3,
      zoom: 8,
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
        tiles: [`/api/map/tiles/{z}/{x}/{y}`],
        tileSize: 256,
        // todo: add attribution
        attribution: `&copy; ${new Date().getFullYear()} HERE Technologies`,
      },
    }

    const layers: LayerSpecification[] = [
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
      attributionControl: false,
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

    newMap.addControl(new AttributionControl({ compact: true }), 'bottom-left')

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
        '.maplibregl-ctrl-bottom-left': {
          textTransform: 'uppercase',
          fontSize: 1,
          fontFamily: 'mono',
          letterSpacing: 'mono',
        },
      }}
    >
      {map && styleLoaded && (
        <>
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
        </>
      )}
    </Box>
  )
}

export default MapComponent
