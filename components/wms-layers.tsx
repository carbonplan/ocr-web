import { useEffect, useMemo } from 'react'
import { useColorMode } from 'theme-ui'
import { useStore } from '../lib/store'
import { generateColormap } from '@/lib/colormaps'

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
    if (!map || !(riskRaster || rpsRaster)) return

    const removeExistingWmsLayers = () => {
      riskMatrix.forEach((risk) => {
        if (map.getLayer(risk.id)) {
          map.removeLayer(risk.id)
        }
        if (map.getSource(risk.id)) {
          map.removeSource(risk.id)
        }
      })

      rpsMatrix.forEach((rps) => {
        if (map.getLayer(rps.id)) {
          map.removeLayer(rps.id)
        }
        if (map.getSource(rps.id)) {
          map.removeSource(rps.id)
        }
      })
    }

    const addWmsLayers = () => {
      removeExistingWmsLayers()

      riskMatrix.forEach((risk) => {
        map.addSource(risk.id, {
          type: 'raster',
          tiles: [risk.url],
          tileSize: 256,
        })
      })

      rpsMatrix.forEach((rps) => {
        map.addSource(rps.id, {
          type: 'raster',
          tiles: [rps.url],
          tileSize: 256,
        })
      })

      riskMatrix.forEach((risk) => {
        map.addLayer(
          {
            id: risk.id,
            type: 'raster',
            source: risk.id,
            layout: {
              visibility:
                risk.id === activeRiskLayerId && riskRaster
                  ? 'visible'
                  : 'none',
            },
          },
          'satellite',
        )
      })

      rpsMatrix.forEach((rps) => {
        map.addLayer(
          {
            id: rps.id,
            type: 'raster',
            source: rps.id,
            layout: {
              visibility:
                rps.id === activeRpsLayerId && rpsRaster ? 'visible' : 'none',
            },
          },
          'satellite',
        )
      })
    }

    if (map.isStyleLoaded()) {
      addWmsLayers()
    } else {
      map.once('styledata', addWmsLayers)
    }

    return () => {
      map.off('styledata', addWmsLayers)
      if (map.isStyleLoaded()) {
        removeExistingWmsLayers()
      }
    }
  }, [
    map,
    riskMatrix,
    rpsMatrix,
    riskRaster,
    rpsRaster,
    activeRiskLayerId,
    activeRpsLayerId,
  ])

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

  return null
}

export default WmsLayers
