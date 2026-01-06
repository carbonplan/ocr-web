import { useEffect, useMemo } from 'react'
import { useColorMode } from 'theme-ui'
import { RasterTileSource } from 'maplibre-gl'
import { useStore } from '../lib/store'
import { useColormap } from '@/lib/colormaps'
import { DATA_URLS } from '@/lib/config'

const epsilon = 1e-9

const WmsLayers = () => {
  const map = useStore((state) => state.map)
  const timePeriod = useStore((state) => state.timePeriod)
  const colorLimits = useStore((state) => state.colorLimits)
  const [colorMode] = useColorMode()
  const lightColormap = useColormap({ mode: 'light' })
  const darkColormap = useColormap({ mode: 'dark' })

  const colorscaleRange = useMemo(() => {
    const [min, max] = colorLimits.bounds
    const lowerBound = min === 0 ? epsilon : min
    return `${lowerBound},${max}`
  }, [colorLimits])

  const binsParam = useMemo(() => {
    const correctedBinBoundaries = colorLimits.binBoundaries.map(
      (value, index) => (index === 0 && value === 0 ? epsilon : value),
    )
    return `&bins=${correctedBinBoundaries.join(',')}`
  }, [colorLimits])

  const riskMatrix = useMemo(() => {
    const riskAttributes = ['wind_risk_2011', 'wind_risk_2047']
    const themes = ['light', 'dark']

    const matrix = []
    for (const themeType of themes) {
      const colormap = (
        themeType === 'light' ? lightColormap : darkColormap
      ).slice(1) // remove 0-value color
      for (const attr of riskAttributes) {
        const url = `${DATA_URLS.raster.png}/wms/?service=WMS&request=GetMap&version=1.1.1&layers=${attr}&styles=raster/${encodeURIComponent(colormap.join(','))}&colorscalerange=${colorscaleRange}${binsParam}&transparent_below_range=true&format=image/png&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}`
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

  const activeRiskLayerId = useMemo(() => {
    const riskAttribute =
      timePeriod === 'current' ? 'wind_risk_2011' : 'wind_risk_2047'
    const currentTheme = colorMode === 'dark' ? 'dark' : 'light'
    return `wms_risk_${riskAttribute}_${currentTheme}`
  }, [timePeriod, colorMode])

  // manage full url updates
  useEffect(() => {
    if (!map) return

    const addedLayerIds: string[] = []

    riskMatrix.forEach((layer) => {
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
      addedLayerIds.push(layer.id)
    })

    return () => {
      addedLayerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId)
        }
        if (map.getSource(layerId)) {
          map.removeSource(layerId)
        }
      })
    }
  }, [map, riskMatrix])

  useEffect(() => {
    if (!map) return

    riskMatrix.forEach((layer) => {
      if (map.getLayer(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      }
    })

    if (activeRiskLayerId && map.getLayer(activeRiskLayerId)) {
      map.setLayoutProperty(activeRiskLayerId, 'visibility', 'visible')
    }
  }, [map, riskMatrix, activeRiskLayerId])

  return null
}

export default WmsLayers
