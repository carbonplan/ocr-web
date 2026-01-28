import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import {
  Map,
  LngLat,
  addProtocol,
  removeProtocol,
  LayerSpecification,
  SourceSpecification,
  MapSourceDataEvent,
  MapMouseEvent,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { Box, useThemeUI } from 'theme-ui'
import { useBreakpointIndex } from '@theme-ui/match-media'
import { useMapTheme } from '../hooks/useMapTheme'
import { useStore } from '../lib/store'
import { useBuildingUtils } from '@/hooks/useBuildingUtils'
import { Building, Geography, GeographyKey } from '@/types/location'
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
import {
  GEOGRAPHY_ATTRIBUTE_KEYS,
  GEOGRAPHY_MIN_ZOOM,
  LAYERS,
} from '@/lib/config'
import { getRiskSources, insertRiskLayers } from '@/lib/risk-layers'
import {
  getMapViewFromQuery,
  updateMapViewUrl,
  getSelectionCoordinatesFromQuery,
} from '@/lib/url-utils'

const BUILDING_POINTS_MIN_ZOOM = 12
const BUILDING_MIN_ZOOM = 13

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
  const activeGeographies = useStore((state) => state.activeGeographies)
  const selectedGeographyLevel = useStore(
    (state) => state.selectedGeographyLevel,
  )
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
  const queryGeographiesAtPoint = useStore(
    (state) => state.queryGeographiesAtPoint,
  )
  const { highlightBuildingAtLocation, selectBuilding } = useBuildingUtils()

  const updateGeographies = useCallback(
    (userSelected: boolean) => {
      if (!map) return
      const center = map.getCenter()
      queryGeographiesAtPoint(center.lng, center.lat, userSelected)
    },
    [map, queryGeographiesAtPoint],
  )

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!map) return

      const zoom = map.getZoom()

      // Building click has highest priority (only at zoom > 13)
      const buildingFeatures =
        zoom > BUILDING_MIN_ZOOM
          ? map.queryRenderedFeatures(e.point, {
              layers: [LAYERS.buildings.layerIds.fill],
            })
          : []

      if (buildingFeatures.length > 0) {
        selectBuilding(buildingFeatures[0] as unknown as Building)
        return
      }

      // If building points have priority (zoom >= 12), let the building points handler handle it
      if (zoom >= BUILDING_POINTS_MIN_ZOOM) {
        const buildingPointFeatures = map.queryRenderedFeatures(e.point, {
          layers: [LAYERS.buildingPoints.layerIds.circle],
        })
        if (buildingPointFeatures.length > 0) return
      }

      const geographyLayerMap: Record<GeographyKey, string | null> = {
        county: LAYERS.counties.layerIds.fill,
        censusTract: LAYERS.censusTracts.layerIds.fill,
        censusBlock: LAYERS.censusBlocks.layerIds.fill,
        state: LAYERS.states.layerIds.fill,
        nation: null,
      }

      const geographyLayer = geographyLayerMap[selectedGeographyLevel]
      const minZoom = GEOGRAPHY_MIN_ZOOM[selectedGeographyLevel]

      if (geographyLayer && zoom >= minZoom) {
        const geographyFeatures = map.queryRenderedFeatures(e.point, {
          layers: [geographyLayer],
        })

        if (geographyFeatures.length > 0) {
          const geography = geographyFeatures[0].properties as Geography
          const clickedGeoid = geography[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]
          const currentGeoid =
            activeGeographies[selectedGeographyLevel]?.[
              GEOGRAPHY_ATTRIBUTE_KEYS.geoid
            ]

          // If clicking the same geography, deselect and resume auto-update
          if (clickedGeoid && clickedGeoid === currentGeoid) {
            clearSelections()
            return
          }

          const lngLat = e.lngLat
          queryGeographiesAtPoint(lngLat.lng, lngLat.lat, true)
          return
        }
      }

      clearSelections()
    },
    [
      map,
      selectBuilding,
      selectedGeographyLevel,
      activeGeographies,
      queryGeographiesAtPoint,
      clearSelections,
    ],
  )

  useEffect(() => {
    if (!map) return
    const padding =
      index < 2 ? { bottom: window.innerHeight / 2 } : { bottom: 0 }
    map.setPadding(padding)
  }, [map, index])

  useEffect(() => {
    if (!map) return

    map.on('click', handleMapClick)

    return () => {
      map.off('click', handleMapClick)
    }
  }, [map, handleMapClick])

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
        const sw = [-130, 25]
        const ne = [-75, 60]
        const minZoom = 2
        const maxZoom = 16.75
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
        updateGeographies(false)
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
        updateGeographies(false)
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
          updateGeographies(false)
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
          {riskRaster && <ZarrLayer />}
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
