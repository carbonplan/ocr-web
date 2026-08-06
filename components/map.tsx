import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import {
  Map,
  LngLat,
  addProtocol,
  removeProtocol,
  LayerSpecification,
  SourceSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { Box, useThemeUI } from 'theme-ui'
import { useBreakpointIndex } from '@theme-ui/match-media'
import { useMapTheme } from '../hooks/useMapTheme'
import { useStore } from '../lib/store'
import { useBuildingUtils } from '@/hooks/useBuildingUtils'
import { useBuildingQuery } from '@/hooks/useBuildingQuery'
import {
  Buildings,
  BuildingPoints,
  SelectionMarker,
  GeographyLayer,
  SatelliteLayer,
  HillshadeLayer,
  ZarrLayer,
  MapControls,
  useMapControlStyles,
} from './'
import { LAYERS } from '@/lib/config'
import { ensureSourceLoaded } from '@/lib/map-utils'
import { getRiskSources, insertRiskLayers } from '@/lib/risk-layers'
import {
  getMapViewFromQuery,
  updateMapViewUrl,
  getSelectionCoordinatesFromQuery,
  getAreaCoordinatesFromQuery,
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
  const buildingsMode = useStore((state) => state.riskConfig.buildingsMode)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const index = useBreakpointIndex({ defaultIndex: 2 })
  const { theme } = useThemeUI()

  const getInitialZoom = useCallback((): number => {
    const width = window.innerWidth
    const sidebarBreakpoint = theme?.breakpoints?.[1] ?? '64em'
    const hasSidebar = window.matchMedia(
      `(min-width: ${sidebarBreakpoint})`,
    ).matches
    const mapWidth = hasSidebar ? width * (2 / 3) : width
    return Math.log2(mapWidth) - 6.3
  }, [theme.breakpoints])

  const mapLayers = useMapTheme()
  const mapControlStyles = useMapControlStyles()
  useBuildingQuery()
  const queryGeographiesAtPoint = useStore(
    (state) => state.queryGeographiesAtPoint,
  )
  const { highlightBuildingAtLocation, selectArea } = useBuildingUtils()

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

    const queryView = getMapViewFromQuery(router.query)
    const initialView = queryView || {
      lat: 39.83,
      lng: -97.58,
      zoom: getInitialZoom(),
    }

    const sources: Record<string, SourceSpecification> = {
      basemap: {
        type: 'vector',
        url: 'pmtiles://https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/pmtiles/global.pmtiles',
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
        projection: { type: 'globe' },
      },
      center: [initialView.lng, initialView.lat],
      zoom: initialView.zoom,
      transformConstrain: (center, zoom) => {
        const sw = [-135, 20]
        const ne = [-65, 55]
        const minZoom = 2
        const maxZoom = 20
        return {
          center: new LngLat(
            Math.max(sw[0], Math.min(ne[0], center.lng)),
            Math.max(sw[1], Math.min(ne[1], center.lat)),
          ),
          zoom: Math.max(minZoom, Math.min(maxZoom, zoom)),
        }
      },
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
    const areaCoordinates = getAreaCoordinatesFromQuery(router.query)
    if (selectionCoordinates) {
      map.jumpTo({
        center: [selectionCoordinates.lng, selectionCoordinates.lat],
        zoom: 16,
      })
    } else if (areaCoordinates) {
      // area selections describe coarse raster cells, so land well zoomed out
      map.jumpTo({
        center: [areaCoordinates.lng, areaCoordinates.lat],
        zoom: 9,
      })
    }
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
    const init = async () => {
      await ensureSourceLoaded(map, LAYERS.regions.sourceId)
      updateGeographies()
    }
    init()
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

    const areaCoordinates = getAreaCoordinatesFromQuery(router.query)
    if (areaCoordinates && buildingsMode === 'query') {
      const initArea = async () => {
        await ensureSourceLoaded(map, LAYERS.buildings.sourceId)
        selectArea(areaCoordinates.lng, areaCoordinates.lat)
      }
      initArea()
      return
    }

    const selectionCoordinates = getSelectionCoordinatesFromQuery(router.query)
    if (!selectionCoordinates) return
    const { lat, lng } = selectionCoordinates

    const init = async () => {
      await ensureSourceLoaded(map, LAYERS.buildings.sourceId)
      const found = highlightBuildingAtLocation(lng, lat)
      if (!found) {
        clearSelections()
        updateGeographies()
      }
    }
    init()
  }, [
    map,
    router.isReady,
    router.query,
    buildingsMode,
    highlightBuildingAtLocation,
    selectArea,
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
          {/* query-mode hazards keep the layer mounted (hidden via opacity)
              so point queries work while the raster is toggled off */}
          {(riskRaster || buildingsMode === 'query') && <ZarrLayer />}
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
