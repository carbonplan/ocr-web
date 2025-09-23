import { useEffect, useMemo } from 'react'
import { useColorMode } from 'theme-ui'
import { RasterTileSource } from 'maplibre-gl'
import { useStore } from '../lib/store'
import { generateColormap } from '@/lib/colormaps'
import { DATA_URLS } from '@/lib/config'

const WmsLayers = () => {
  const map = useStore((state) => state.map)
  const riskRaster = useStore((state) => state.riskRaster)
  const rpsRaster = useStore((state) => state.rpsRaster)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const attribute = useStore((state) => state.attribute)
  const timeHorizon = useStore((state) => state.timeHorizon)
  const colorLimits = useStore((state) => state.colorLimits)

  const [colorMode] = useColorMode()

  const colorscaleRange = useMemo(() => {
    const epsilon = 1e-9
    const [min, max] = colorLimits.bounds
    return `${min - epsilon},${max}`
  }, [colorLimits])

  const lightColormap = useMemo(
    () => generateColormap(riskConfig.colormap, { count: 30, mode: 'light' }),
    [riskConfig.colormap],
  )
  const darkColormap = useMemo(
    () => generateColormap(riskConfig.colormap, { count: 30, mode: 'dark' }),
    [riskConfig.colormap],
  )

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
          const url = `${DATA_URLS.raster.risk}/wms/?service=WMS&request=GetMap&version=1.1.1&layers=${attr}_horizon_${horizon}&styles=raster/${encodeURIComponent(colormap.join(','))}&colorscalerange=${colorscaleRange}&transparent_below_range=true&format=image/png&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
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
  }, [riskConfig, lightColormap, darkColormap, colorscaleRange])

  const rpsMatrix = useMemo(() => {
    const timeHorizons = [1, 15, 30]
    const themes = ['light', 'dark']

    const matrix = []
    for (const themeType of themes) {
      const colormap = themeType === 'light' ? lightColormap : darkColormap
      for (const horizon of timeHorizons) {
        const url = `${DATA_URLS.raster.usfsBase}/wms/?service=WMS&request=GetMap&version=1.1.1&layers=RPS_horizon_${horizon}&styles=raster/${encodeURIComponent(colormap.join(','))}&colorscalerange=${colorscaleRange}&transparent_below_range=true&format=image/png&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
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
  }, [lightColormap, darkColormap, colorscaleRange])

  const activeRiskLayerId = useMemo(() => {
    const riskAttribute = riskConfig.attributes[attribute][timePeriod]
    const currentTheme = colorMode === 'dark' ? 'dark' : 'light'
    return `wms_risk_${riskAttribute}_horizon_${timeHorizon}_${currentTheme}`
  }, [attribute, riskConfig, timePeriod, timeHorizon, colorMode])

  const activeRpsLayerId = useMemo(() => {
    const currentTheme = colorMode === 'dark' ? 'dark' : 'light'
    return `wms_rps_RPS_horizon_${timeHorizon}_${currentTheme}`
  }, [timeHorizon, colorMode])

  // manage full url updates
  useEffect(() => {
    if (!map) return

    const allLayers = [...riskMatrix, ...rpsMatrix]
    allLayers.forEach((layer) => {
      const existingSource = map.getSource(layer.id)
      if (!existingSource) {
        map.addSource(layer.id, {
          type: 'raster',
          tiles: [layer.url],
          tileSize: 256,
        })
      } else if (existingSource.type === 'raster') {
        const rasterSource = existingSource as RasterTileSource
        const currentTiles = rasterSource.tiles
        if (!currentTiles || currentTiles[0] !== layer.url) {
          if (map.getLayer(layer.id)) {
            map.removeLayer(layer.id)
          }
          map.removeSource(layer.id)
          map.addSource(layer.id, {
            type: 'raster',
            tiles: [layer.url],
            tileSize: 256,
          })
        }
      }

      if (!map.getLayer(layer.id)) {
        map.addLayer(
          {
            id: layer.id,
            type: 'raster',
            source: layer.id,
            layout: { visibility: 'none' },
          },
          'satellite',
        )
      }
    })
  }, [map, riskMatrix, rpsMatrix])

  // manage layer visibility
  useEffect(() => {
    if (!map) return

    const allLayers = [...riskMatrix, ...rpsMatrix]

    allLayers.forEach((layer) => {
      if (map.getLayer(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      }
    })

    if (riskRaster && activeRiskLayerId && map.getLayer(activeRiskLayerId)) {
      map.setLayoutProperty(activeRiskLayerId, 'visibility', 'visible')
    }
    if (rpsRaster && activeRpsLayerId && map.getLayer(activeRpsLayerId)) {
      map.setLayoutProperty(activeRpsLayerId, 'visibility', 'visible')
    }
  }, [
    riskRaster,
    activeRiskLayerId,
    rpsRaster,
    activeRpsLayerId,
    map,
    riskMatrix,
    rpsMatrix,
  ])

  return null
}

export default WmsLayers
