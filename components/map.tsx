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
  SatelliteLayer,
  HillshadeLayer,
  ZarrLayer,
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
      lat: 34.101,
      lng: -117.792,
      zoom: 8.0,
    }

    const sources: Record<string, SourceSpecification> = {
      basemap: {
        type: 'vector',
        url: 'pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/lower48.pmtiles',
        attribution:
          '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
      regions: {
        type: 'vector',
        url: `pmtiles://${DATA_URLS.vector.regions}`,
      },
    }

    const newMap = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs:
          'https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf',
        sources,
        layers: mapLayers,
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
      setMapLoading(true)
    }

    const handleLoadingOff = () => {
      setMapLoading(false)
    }

    const handleStyleLoad = () => {
      setStyleLoaded(true)
    }

    newMap.on('dataloading', handleLoadingOn)
    newMap.on('idle', handleLoadingOff)
    newMap.on('moveend', handleMoveEnd)
    newMap.once('styledata', handleStyleLoad)

    setMap(newMap)

    return () => {
      newMap.off('dataloading', handleLoadingOn)
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
          <SatelliteLayer />
          <HillshadeLayer />
          <WmsLayers />
          <ZarrLayer />
          <GeographyLayer config={LAYERS.counties} geographyKey='county' />
          <GeographyLayer
            config={LAYERS.censusTracts}
            geographyKey='censusTract'
          />
          <GeographyLayer
            config={LAYERS.censusBlocks}
            geographyKey='censusBlock'
          />
          <Buildings />
          <SelectionMarker />
        </>
      )}
    </Box>
  )
}

export default MapComponent
