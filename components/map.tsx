import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import {
  StyleSpecification,
  Map,
  addProtocol,
  removeProtocol,
  LayerSpecification,
  SourceSpecification,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { useColorMode } from 'theme-ui'
import { useMapTheme } from '../hooks/useMapTheme'
import { useStore } from '../lib/store'
import { Buildings } from './'
import { generateColormap } from '@/lib/colormaps'
import { getMapViewFromQuery, updateMapViewUrl } from '@/lib/url-utils'

const MapComponent = () => {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null) // ref for cleanup
  const map = useStore((state) => state.map)
  const setMap = useStore((state) => state.setMap)
  const satellite = useStore((state) => state.satellite)
  const riskRaster = useStore((state) => state.riskRaster)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const attribute = useStore((state) => state.attribute)
  const timeHorizon = useStore((state) => state.timeHorizon)
  const colorLimits = useStore((state) => state.colorLimits)
  const setMapLoading = useStore((state) => state.setMapLoading)

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
  }, [riskConfig, lightColormap, darkColormap])

  const activeRiskLayerId = useMemo(() => {
    const riskAttribute = riskConfig.attributes[attribute][timePeriod]
    const currentTheme = colorMode === 'dark' ? 'dark' : 'light'
    return `wms_risk_${riskAttribute}_horizon_${timeHorizon}_${currentTheme}`
  }, [attribute, riskConfig, timePeriod, timeHorizon, colorMode])

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
          layers,
        },
        center: [initialView.lng, initialView.lat],
        zoom: initialView.zoom,
      })

      const handleMoveEnd = () => {
        const center = newMap.getCenter()
        const zoom = newMap.getZoom()
        updateMapViewUrl(router, {
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
      mapRef.current = newMap

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
  }, [riskMatrix, setMap, router.isReady])

  useEffect(() => {
    const applyStyle = () => {
      if (!map) return
      const existingStyle = map.getStyle()
      const specialLayers = existingStyle.layers.filter(
        (layer) =>
          layer.id === 'satellite' ||
          layer.id.startsWith('wms_risk_') ||
          layer.id.startsWith('buildings-'),
      )
      const newLayers = [...specialLayers, ...mapLayers]

      const newStyle: StyleSpecification = {
        ...existingStyle,
        layers: newLayers,
        sprite,
      }
      map.setStyle(newStyle)
    }
    if (!map || !map.getStyle()) {
      map?.once('style.load', applyStyle)
    } else {
      applyStyle()
    }
  }, [mapLayers, sprite, map])

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

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <Buildings />
    </div>
  )
}

export default MapComponent
