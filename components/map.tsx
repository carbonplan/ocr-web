import { useEffect, useMemo, useRef } from 'react'
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
import { useMapTheme } from '../hooks/useMapTheme'
import { useLocationStore } from '../store/location'
import { Buildings } from './'

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null) // ref for cleanup
  const map = useLocationStore((state) => state.map)
  const setMap = useLocationStore((state) => state.setMap)
  const satellite = useLocationStore((state) => state.satellite)
  const riskRaster = useLocationStore((state) => state.riskRaster)
  const riskConfig = useLocationStore((state) => state.riskConfig)
  const timePeriod = useLocationStore((state) => state.timePeriod)
  const wind = useLocationStore((state) => state.wind)
  const timeHorizon = useLocationStore((state) => state.timeHorizon)

  const { mapLayers, sprite } = useMapTheme()

  const riskMatrix = useMemo(() => {
    const riskAttributes = [
      riskConfig.attributes.baseRisk.current,
      riskConfig.attributes.baseRisk.future,
      riskConfig.attributes.windRisk.current,
      riskConfig.attributes.windRisk.future,
    ]
    const timeHorizons = [1, 15, 30]

    const matrix = []
    for (const attr of riskAttributes) {
      for (const horizon of timeHorizons) {
        const url = `https://riqciuucelosieuysvceek7tzm0aofof.lambda-url.us-west-2.on.aws/datasets/fire/wms/?service=WMS&request=GetMap&version=1.1.1&layers=${attr}_horizon_${horizon}&styles=raster/hot&colorscalerange=0,100&format=image/png&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
        matrix.push({
          id: `wms_risk_${attr}_horizon_${horizon}`,
          riskAttribute: attr,
          timeHorizon: horizon,
          url,
        })
      }
    }
    return matrix
  }, [riskConfig])

  const activeRiskLayerId = useMemo(() => {
    const riskAttribute = wind
      ? riskConfig.attributes.windRisk[timePeriod]
      : riskConfig.attributes.baseRisk[timePeriod]

    return `wms_risk_${riskAttribute}_horizon_${timeHorizon}`
  }, [wind, riskConfig, timePeriod, timeHorizon])

  useEffect(() => {
    if (mapContainer.current) {
      const protocol = new Protocol()
      addProtocol('pmtiles', protocol.tile)

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
          minzoom: 12,
          tileSize: 256,
        }
      })

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

      riskMatrix.forEach((risk) => {
        layers.push({
          id: risk.id,
          type: 'raster',
          source: risk.id,
          paint: {
            'raster-opacity': 0.7,
          },
          layout: {
            visibility: 'none',
          },
        })
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
        center: [-121.3, 47.70818],
        zoom: 8,
      })
      setMap(newMap)
      mapRef.current = newMap
    }

    return () => {
      removeProtocol('pmtiles')
      mapRef.current?.remove()
      setMap(null)
    }
  }, [riskMatrix, setMap])

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
    if (!map || !map.isStyleLoaded()) return
    map.setLayoutProperty(
      'satellite',
      'visibility',
      satellite ? 'visible' : 'none',
    )
  }, [satellite, map])

  useEffect(() => {
    if (!map) return
    riskMatrix.forEach((risk) => {
      if (map.getLayer(risk.id)) {
        map.setLayoutProperty(risk.id, 'visibility', 'none')
      }
    })
    if (riskRaster && map.getLayer(activeRiskLayerId)) {
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
