import { useEffect, useMemo } from 'react'
import { useColorMode } from 'theme-ui'
import { RasterTileSource } from 'maplibre-gl'
import { useStore } from '../lib/store'
import { generateColormap } from '@/lib/colormaps'
import { DATA_URLS } from '@/lib/config'

const epsilon = 1e-9

const WmsLayers = () => {
  const map = useStore((state) => state.map)
  const riskRaster = useStore((state) => state.riskRaster)
  const rpsRaster = useStore((state) => state.rpsRaster)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const colorLimits = useStore((state) => state.colorLimits)
  const [colorMode] = useColorMode()

  const colorscaleRange = useMemo(() => {
    const [min, max] = colorLimits.bounds
    return `${min - epsilon},${max}`
  }, [colorLimits])

  const binsParam = useMemo(() => {
    if (
      colorLimits.type === 'discrete' &&
      colorLimits.binBoundaries.length > 0
    ) {
      // replace first value with epsilon corrected value
      const correctedBinBoundaries = colorLimits.binBoundaries.map(
        (value, index) => (index === 0 ? value - epsilon : value),
      )
      return `&bins=${correctedBinBoundaries.join(',')}`
    }
    return ''
  }, [colorLimits])

  const count = useMemo(() => {
    if (colorLimits.type === 'discrete') {
      return colorLimits.binBoundaries.length
    }
    return 30
  }, [colorLimits])

  const lightColormap = useMemo(
    () => generateColormap(riskConfig.colormap, { count, mode: 'light' }),
    [riskConfig.colormap, count],
  )
  const darkColormap = useMemo(
    () => generateColormap(riskConfig.colormap, { count, mode: 'dark' }),
    [riskConfig.colormap, count],
  )

  const riskMatrix = useMemo(() => {
    const riskAttributes = ['wind_risk_2011', 'wind_risk_2047']
    const themes = ['light', 'dark']

    const matrix = []
    for (const themeType of themes) {
      const colormap = themeType === 'light' ? lightColormap : darkColormap
      for (const attr of riskAttributes) {
        const url = `${DATA_URLS.raster.risk}/wms/?service=WMS&request=GetMap&version=1.1.1&layers=${attr}&styles=raster/${encodeURIComponent(colormap.join(','))}&colorscalerange=${colorscaleRange}${binsParam}&transparent_below_range=true&format=image/png&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
        matrix.push({
          id: `wms_risk_${attr}_${themeType}`,
          riskAttribute: attr,
          theme: themeType,
          url,
        })
      }
    }
    return matrix
  }, [lightColormap, darkColormap, colorscaleRange, binsParam])

  const rpsMatrix = useMemo(() => {
    const themes = ['light', 'dark']

    const matrix = []
    for (const themeType of themes) {
      const colormap = themeType === 'light' ? lightColormap : darkColormap
      const url = `${DATA_URLS.raster.usfsBase}/wms/?service=WMS&request=GetMap&version=1.1.1&layers=RPS&styles=raster/${encodeURIComponent(colormap.join(','))}&colorscalerange=${colorscaleRange}&transparent_below_range=true&format=image/png&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
      matrix.push({
        id: `wms_rps_RPS_${themeType}`,
        riskAttribute: 'RPS',
        theme: themeType,
        url,
      })
    }
    return matrix
  }, [lightColormap, darkColormap, colorscaleRange])

  const activeRiskLayerId = useMemo(() => {
    const riskAttribute =
      timePeriod === 'current' ? 'wind_risk_2011' : 'wind_risk_2047'
    const currentTheme = colorMode === 'dark' ? 'dark' : 'light'
    return `wms_risk_${riskAttribute}_${currentTheme}`
  }, [timePeriod, colorMode])

  const activeRpsLayerId = useMemo(() => {
    const currentTheme = colorMode === 'dark' ? 'dark' : 'light'
    return `wms_rps_RPS_${currentTheme}`
  }, [colorMode])

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
