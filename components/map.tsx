import { useEffect, useMemo, useRef } from 'react'
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
import { Box, useColorMode } from 'theme-ui'
import { useMapTheme } from '../hooks/useMapTheme'
import { useStore } from '../lib/store'
import { Buildings, GeographyLayer } from './'
import { LAYERS } from '@/lib/config'
import { generateColormap } from '@/lib/colormaps'
import { getMapViewFromQuery, updateMapViewUrl } from '@/lib/url-utils'

const MapComponent = () => {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useStore((state) => state.map)
  const setMap = useStore((state) => state.setMap)
  const satellite = useStore((state) => state.satellite)
  const riskRaster = useStore((state) => state.riskRaster)
  const rpsRaster = useStore((state) => state.rpsRaster)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const attribute = useStore((state) => state.attribute)
  const timeHorizon = useStore((state) => state.timeHorizon)
  const colorLimits = useStore((state) => state.colorLimits)
  const setMapLoading = useStore((state) => state.setMapLoading)
  const geographies = useStore((state) => state.geographies)
  const sidebarWidth = useStore((state) => state.sidebarWidth)

  const [colorMode] = useColorMode()

  const lightColormap = useMemo(
    () => generateColormap(riskConfig.colormap, { count: 30, mode: 'light' }),
    [riskConfig.colormap],
  )
  const darkColormap = useMemo(
    () => generateColormap(riskConfig.colormap, { count: 30, mode: 'dark' }),
    [riskConfig.colormap],
  )

  const { mapLayers, sprite } = useMapTheme()

  const riskMatrix = useMemo(() => {
    const riskAttributes = [
      riskConfig.attributes.baseRisk.current,
      riskConfig.attributes.baseRisk.future,
      riskConfig.attributes.windRisk.current,
      riskConfig.attributes.windRisk.future,
    ]
    const timeHorizons = [1, 15, 30]
    const themes = ['light', 'dark']

    const matrix = []
    for (const themeType of themes) {
      const colormap = themeType === 'light' ? lightColormap : darkColormap
      for (const attr of riskAttributes) {
        for (const horizon of timeHorizons) {
          const url = `${process.env.NEXT_PUBLIC_RISK_RASTER_URL}/wms/?service=WMS&request=GetMap&version=1.1.1&layers=${attr}_horizon_${horizon}&styles=raster/${encodeURIComponent(colormap.join(','))}&colorscalerange=${colorLimits.bounds.join(',')}&transparent_below_range=true&format=image/png&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
          matrix.push({
            id: `wms_risk_${attr}_horizon_${horizon}_${themeType}`,
            riskAttribute: attr,
            timeHorizon: horizon,
            theme: themeType,
            url,
          })
        }
      }
    }
    return matrix
  }, [riskConfig, lightColormap, darkColormap, colorLimits])

  const rpsMatrix = useMemo(() => {
    const timeHorizons = [1, 15, 30]
    const themes = ['light', 'dark']

    const matrix = []
    for (const themeType of themes) {
      const colormap = themeType === 'light' ? lightColormap : darkColormap
      for (const horizon of timeHorizons) {
        const url = `${process.env.NEXT_PUBLIC_RPS_RASTER_URL}/wms/?service=WMS&request=GetMap&version=1.1.1&layers=RPS_horizon_${horizon}&styles=raster/${encodeURIComponent(colormap.join(','))}&colorscalerange=${colorLimits.bounds.join(',')}&transparent_below_range=true&format=image/png&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
        matrix.push({
          id: `wms_rps_RPS_horizon_${horizon}_${themeType}`,
          riskAttribute: 'RPS',
          timeHorizon: horizon,
          theme: themeType,
          url,
        })
      }
    }
    return matrix
  }, [lightColormap, darkColormap, colorLimits])

  const activeRiskLayerId = useMemo(() => {
    const riskAttribute = riskConfig.attributes[attribute][timePeriod]
    const currentTheme = colorMode === 'dark' ? 'dark' : 'light'
    return `wms_risk_${riskAttribute}_horizon_${timeHorizon}_${currentTheme}`
  }, [attribute, riskConfig, timePeriod, timeHorizon, colorMode])

  const activeRpsLayerId = useMemo(() => {
    const currentTheme = colorMode === 'dark' ? 'dark' : 'light'
    return `wms_rps_RPS_horizon_${timeHorizon}_${currentTheme}`
  }, [timeHorizon, colorMode])

  useEffect(() => {
    if (mapContainer.current && router.isReady) {
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
        },
      }

      riskMatrix.forEach((risk) => {
        sources[risk.id] = {
          type: 'raster',
          tiles: [risk.url],
          tileSize: 256,
        }
      })

      rpsMatrix.forEach((rps) => {
        sources[rps.id] = {
          type: 'raster',
          tiles: [rps.url],
          tileSize: 256,
        }
      })

      const layers: LayerSpecification[] = []

      riskMatrix.forEach((risk) => {
        layers.push({
          id: risk.id,
          type: 'raster',
          source: risk.id,
          layout: {
            visibility: 'none',
          },
        })
      })
      rpsMatrix.forEach((rps) => {
        layers.push({
          id: rps.id,
          type: 'raster',
          source: rps.id,
          layout: {
            visibility: 'none',
          },
        })
      })
      layers.push({
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
      })

      const newMap = new Map({
        container: mapContainer.current,
        style: {
          version: 8,
          glyphs:
            'https://carbonplan-maps.s3.us-west-2.amazonaws.com/basemaps/fonts/{fontstack}/{range}.pbf',
          sources,
          layers: [...layers, ...mapLayers],
          sprite,
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

      newMap.on('sourcedata', handleLoadingOn)
      newMap.on('idle', handleLoadingOff)
      newMap.on('moveend', handleMoveEnd)

      setMap(newMap)

      return () => {
        if (newMap) {
          newMap.off('sourcedata', handleLoadingOn)
          newMap.off('idle', handleLoadingOff)
          newMap.off('moveend', handleMoveEnd)
          newMap.remove()
        }
      }
    }

    return () => {
      removeProtocol('pmtiles')
      setMap(null)
    }
  }, [riskMatrix, rpsMatrix, setMap, setMapLoading, router, router.isReady])

  useEffect(() => {
    if (!map) return
    const currentStyle = map.getStyle()
    if (!currentStyle) return
    const newStyle = { ...currentStyle, sprite }
    map.setStyle(newStyle, { diff: true })
    const updateLayerProps = (layerId: string, spec: LayerSpecification) => {
      if (spec.paint) {
        for (const [key, value] of Object.entries(spec.paint)) {
          map.setPaintProperty(layerId, key, value)
        }
      }
    }
    mapLayers.forEach((layerSpec) => updateLayerProps(layerSpec.id, layerSpec))
  }, [mapLayers, map, sprite])

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

  useEffect(() => {
    if (!map) return
    riskMatrix.forEach((risk) => {
      if (map.getLayer(risk.id)) {
        map.setLayoutProperty(risk.id, 'visibility', 'none')
      }
    })
    if (riskRaster && activeRiskLayerId && map.getLayer(activeRiskLayerId)) {
      map.setLayoutProperty(activeRiskLayerId, 'visibility', 'visible')
    }
  }, [riskRaster, activeRiskLayerId, map, riskMatrix])

  useEffect(() => {
    if (!map) return
    rpsMatrix.forEach((rps) => {
      if (map.getLayer(rps.id)) {
        map.setLayoutProperty(rps.id, 'visibility', 'none')
      }
    })
    if (rpsRaster && activeRpsLayerId && map.getLayer(activeRpsLayerId)) {
      map.setLayoutProperty(activeRpsLayerId, 'visibility', 'visible')
    }
  }, [rpsRaster, activeRpsLayerId, map, rpsMatrix])

  return (
    <Box
      ref={mapContainer}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: sidebarWidth,
      }}
    >
      <GeographyLayer
        config={LAYERS.counties}
        geographyKey='county'
        environmentUrl={process.env.NEXT_PUBLIC_COUNTY_URL!}
      />
      <GeographyLayer
        config={LAYERS.censusTracts}
        geographyKey='censusTract'
        environmentUrl={process.env.NEXT_PUBLIC_CENSUS_TRACT_URL!}
      />
      {geographies.building && <Buildings />}
    </Box>
  )
}

export default MapComponent
