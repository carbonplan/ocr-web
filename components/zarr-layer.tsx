import { useMemo } from 'react'
import { useColormapRGB } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
// @ts-expect-error missing types for carbonplan maps
import { MapProvider, Raster } from '@carbonplan/maps/core'
import { DATA_URLS } from '@/lib/config'

const discard = `
  if (value == fillValue || value > clim.y || value < clim.x) {
    discard;
    return;
  }
`

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormapRGB()
  const timePeriod = useStore((state) => state.timePeriod)
  const setZarrLoading = useStore((state) => state.setZarrLoading)
  const riskAttribute = useMemo(() => {
    return timePeriod === 'current' ? 'wind_risk_2011' : 'wind_risk_2047'
  }, [timePeriod])

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
        setLoading={setZarrLoading}
      />
    </MapProvider>
  )
}

export default ZarrLayer
