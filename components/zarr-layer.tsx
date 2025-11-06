import { useEffect, useState, useMemo, useRef } from 'react'
import { useSpring } from 'react-spring'
import { useColormapRGB } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
// @ts-expect-error missing types for carbonplan maps
import { MapProvider, Raster } from '@carbonplan/maps/core'
import { DATA_URLS, RASTER_ZOOM_THRESHOLD } from '@/lib/config'

const discard = `
  if (value == fillValue || value > clim.y || value < clim.x) {
    discard;
    return;
  }
`

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const riskRaster = useStore((state) => state.riskRaster)
  const setRiskRaster = useStore((state) => state.setRiskRaster)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormapRGB()
  const timePeriod = useStore((state) => state.timePeriod)
  const setZarrLoading = useStore((state) => state.setZarrLoading)
  const riskAttribute = useMemo(() => {
    return timePeriod === 'current' ? 'wind_risk_2011' : 'wind_risk_2047'
  }, [timePeriod])

  const [displayOpacity, setDisplayOpacity] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [currentZoom, setCurrentZoom] = useState<number | undefined>(undefined)
  const previousZoom = useRef<number | undefined>(undefined)
  const previousRiskRaster = useRef<boolean | undefined>(undefined)

  const shouldShowRaster = useMemo(() => {
    if (currentZoom === undefined) return false
    return riskRaster && currentZoom < RASTER_ZOOM_THRESHOLD
  }, [riskRaster, currentZoom])

  useSpring({
    opacity: shouldShowRaster ? 1 : 0,
    config: { duration: 500 },
    onChange: ({ value }) => {
      setDisplayOpacity(value.opacity)
    },
  })

  let opacity = displayOpacity
  if (!transitioning) {
    // snap to opacity immediately if not transitioning
    opacity = shouldShowRaster ? 1 : 0
  }

  useEffect(() => {
    if (!map) return

    const handleZoom = () => {
      const currentZoom = map.getZoom()
      const prevZoom = previousZoom.current

      setCurrentZoom(currentZoom)

      let triggerTransition = false
      let newRiskRaster = riskRaster // prevent stale state
      if (riskRaster !== previousRiskRaster.current) {
        setTransitioning(false)
      }
      if (prevZoom === undefined) {
        newRiskRaster = currentZoom < RASTER_ZOOM_THRESHOLD
      } else if (
        currentZoom < RASTER_ZOOM_THRESHOLD &&
        prevZoom >= RASTER_ZOOM_THRESHOLD
      ) {
        newRiskRaster = true
        triggerTransition = true
      } else if (
        currentZoom >= RASTER_ZOOM_THRESHOLD &&
        prevZoom < RASTER_ZOOM_THRESHOLD
      ) {
        newRiskRaster = false
        triggerTransition = true
      }

      setRiskRaster(newRiskRaster)
      setTransitioning((prev) => prev || triggerTransition)

      previousZoom.current = currentZoom
      previousRiskRaster.current = newRiskRaster
    }

    handleZoom()
    map.on('zoom', handleZoom)
    return () => {
      map.off('zoom', handleZoom)
    }
  }, [map, riskRaster, setRiskRaster])

  const fragShader = useMemo(() => {
    if (colorLimits.type === 'continuous') {
      return `
        float value = ${riskAttribute};
        ${discard}
        float rescaled = (value - clim.x) / (clim.y - clim.x);
        gl_FragColor = texture2D(colormap, vec2(rescaled, 1.0));
        gl_FragColor.a = opacity;
        gl_FragColor.rgb *= gl_FragColor.a;
      `
    }

    const boundaries = colorLimits.binBoundaries || []

    const binConditions = boundaries
      .slice(0, -1)
      .map((_, i) => {
        const condition = i === 0 ? 'if' : 'else if'
        return `
      ${condition} (value < ${boundaries[i + 1].toFixed(6)}) {
        binIndex = ${i}.0;
      }`
      })
      .join('')

    const lastBinIndex = boundaries.length - 1

    return `
      float value = ${riskAttribute};
      ${discard}
      float binIndex = 0.0;
      ${binConditions} else {
        binIndex = ${lastBinIndex}.0;
      }
      float rescaled = binIndex / ${boundaries.length}.0; 
      gl_FragColor = texture2D(colormap, vec2(rescaled, 1.0));
      gl_FragColor.a = opacity;
      gl_FragColor.rgb *= gl_FragColor.a;
    `
  }, [colorLimits.type, colorLimits.binBoundaries, riskAttribute])

  return (
    <MapProvider map={map}>
      <Raster
        colormap={colormap}
        clim={colorLimits.bounds}
        source={DATA_URLS.raster.zarr}
        variable={riskAttribute}
        fillValue={9.969209968386869e36}
        frag={fragShader}
        opacity={opacity}
        setLoading={setZarrLoading}
      />
    </MapProvider>
  )
}

export default ZarrLayer
