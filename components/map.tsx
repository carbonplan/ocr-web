import { useEffect, useRef, useState, useCallback } from 'react'
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
import { useBuildingUtils } from '@/hooks/useBuildingUtils'
import {
  Buildings,
  BuildingPoints,
  SelectionMarker,
  GeographyLayer,
  SatelliteLayer,
  HillshadeLayer,
  RasterLayer,
  MapControls,
  useMapControlStyles,
} from './'
import { LAYERS } from '@/lib/config'
import { getRiskSources, insertRiskLayers } from '@/lib/risk-layers'
import {
  getMapViewFromQuery,
  updateMapViewUrl,
  getSelectionCoordinatesFromQuery,
} from '@/lib/url-utils'

const MapComponent = () => {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useStore((state) => state.map)
  const setMap = useStore((state) => state.setMap)
  const setMapLoading = useStore((state) => state.setMapLoading)
  const sidebarWidth = useStore((state) => state.sidebarWidth)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const clearSelections = useStore((state) => state.clearSelections)
  const riskRaster = useStore((state) => state.riskRaster)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const index = useBreakpointIndex({ defaultIndex: 2 })

  const mapLayers = useMapTheme()
  const mapControlStyles = useMapControlStyles()
  const queryGeographiesAtPoint = useStore(
    (state) => state.queryGeographiesAtPoint,
  )
  const { highlightBuildingAtLocation } = useBuildingUtils()

  const updateGeographies = useCallback(() => {
    if (!map) return
    const center = map.getCenter()
    queryGeographiesAtPoint(center.lng, center.lat)
  }, [map, queryGeographiesAtPoint])

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
      lat: 39.83,
      lng: -98.58,
      zoom: 3,
    }

    const sources: Record<string, SourceSpecification> = {
      basemap: {
        type: 'vector',
        url: 'pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/NA.pmtiles',
        attribution:
          '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
      ...getRiskSources(),
    }

    const orderedLayers = insertRiskLayers(mapLayers)

    const newMap = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs:
          'https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf',
        sources,
        layers: orderedLayers,
      },
      center: [initialView.lng, initialView.lat],
      zoom: initialView.zoom,
      maxBounds: [
        [-130, 10],
        [-60, 65],
      ],
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    })
    newMap.touchZoomRotate.disableRotation()

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
    newMap.once('styledata', handleStyleLoad)

    setMap(newMap)

    return () => {
      newMap.off('dataloading', handleLoadingOn)
      newMap.off('idle', handleLoadingOff)
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
    if (!map || !styleLoaded) return
    const handleMoveEnd = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      updateMapViewUrl({
        lat: center.lat,
        lng: center.lng,
        zoom: zoom,
      })
      if (!selectedBuilding) {
        updateGeographies()
      }
    }
    map.on('moveend', handleMoveEnd)
    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [map, styleLoaded, selectedBuilding, updateGeographies])

  // initial region query
  useEffect(() => {
    if (!map) return
    const handleIdle = () => {
      const layerExists = map.getLayer(LAYERS.counties.layerIds.fill)
      const sourceLoaded = map.isSourceLoaded('regions')

      if (layerExists && sourceLoaded) {
        map.off('idle', handleIdle)
        updateGeographies()
      }
    }
    map.on('idle', handleIdle)
    return () => {
      map.off('idle', handleIdle)
    }
  }, [map, updateGeographies])

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
        if (!found) {
          clearSelections()
          updateGeographies()
        }
      }
    }
    map.on('sourcedata', handleSourceData)
  }, [
    map,
    router.isReady,
    router.query,
    highlightBuildingAtLocation,
    clearSelections,
    updateGeographies,
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
          <MapControls />
          <SatelliteLayer />
          <HillshadeLayer />
          {riskRaster && <RasterLayer />}
          <GeographyLayer config={LAYERS.counties} geographyKey='county' />
          <GeographyLayer
            config={LAYERS.censusTracts}
            geographyKey='censusTract'
          />
          <GeographyLayer
            config={LAYERS.censusBlocks}
            geographyKey='censusBlock'
          />
          <GeographyLayer config={LAYERS.states} geographyKey='state' />
          <GeographyLayer config={LAYERS.nation} geographyKey='nation' />
          <Buildings />
          <BuildingPoints />
          <SelectionMarker />
        </>
      )}
    </Box>
  )
}

export default MapComponent
