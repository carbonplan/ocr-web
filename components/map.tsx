import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Map,
  addProtocol,
  removeProtocol,
  LayerSpecification,
  SourceSpecification,
  MapSourceDataEvent,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { Box } from 'theme-ui'
import { useBreakpointIndex } from '@theme-ui/match-media'
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
import {
  getMapViewFromQuery,
  updateMapViewUrl,
  getSelectionCoordinatesFromQuery,
} from '@/lib/url-utils'
import { useBuildingUtils } from '@/hooks/useBuildingUtils'
import { useReverseGeocode } from '@/hooks/useReverseGeocode'

const MapComponent = () => {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useStore((state) => state.map)
  const setMap = useStore((state) => state.setMap)
  const setMapLoading = useStore((state) => state.setMapLoading)
  const sidebarWidth = useStore((state) => state.sidebarWidth)
  const clearSelections = useStore((state) => state.clearSelections)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const index = useBreakpointIndex({ defaultIndex: 2 })

  const mapLayers = useMapTheme()
  const mapControlStyles = useMapControlStyles()
  const { highlightBuildingAtLocation } = useBuildingUtils()
  const { fetchAddress } = useReverseGeocode()

  useEffect(() => {
    if (!map) return
    const padding =
      index < 2 ? { bottom: window.innerHeight / 2 } : { bottom: 0 }
    map.setPadding(padding)
  }, [map, index])

  useEffect(() => {
    if (!mapContainer.current || !router.isReady) {
      return
    }
    setMapLoading(true)
    const protocol = new Protocol()
    addProtocol('pmtiles', protocol.tile)

    const initialView = getMapViewFromQuery(router.query) || {
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
    if (!router.isReady) return

    const selectionCoordinates = getSelectionCoordinatesFromQuery(router.query)
    if (!selectionCoordinates) return

    map.jumpTo({
      center: [selectionCoordinates.lng, selectionCoordinates.lat],
      zoom: 16,
    })
  }, [map, router.isReady, router.query])

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
    if (!map || !router.isReady) return

    const selectionCoordinates = getSelectionCoordinatesFromQuery(router.query)
    if (!selectionCoordinates) return
    const { lat, lng } = selectionCoordinates

    const handleSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceId === LAYERS.buildings.sourceId && e.isSourceLoaded) {
        map.off('sourcedata', handleSourceData)
        const found = highlightBuildingAtLocation(lng, lat)
        if (found) {
          fetchAddress(lat, lng)
        } else {
          clearSelections()
        }
      }
    }
    map.on('sourcedata', handleSourceData)
  }, [
    map,
    router.isReady,
    router.query,
    highlightBuildingAtLocation,
    fetchAddress,
    clearSelections,
  ])

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
