import { useEffect, useState, useMemo } from 'react'
import { useColormapRGB } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
// @ts-expect-error - carbonplan maps types not available
import { MapProvider, Raster } from '@carbonplan/maps/core'

const createFragShader = (
  variable: string,
  isDiscrete: boolean,
  binBoundaries?: number[],
  colormapLength?: number,
) => {
  if (!isDiscrete) {
    return `
      float value = ${variable};
      if (value == fillValue || value > clim.y) {
        discard;
        return;
      }
      if (value < clim.x) {
        discard;
        return;
      }

      float rescaled = (value - clim.x) / (clim.y - clim.x);
      gl_FragColor = texture2D(colormap, vec2(rescaled, 1.0));
      gl_FragColor.a = opacity;
      gl_FragColor.rgb *= gl_FragColor.a;
    `
  }

  const boundaries = binBoundaries || []

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

  const lastBinIndex = Math.min(boundaries.length - 1, colormapLength! - 1)

  return `
    float value = ${variable};
    if (value == fillValue || value > clim.y) {
      discard;
      return;
    }
    if (value < clim.x) {
      discard;
      return;
    }

    float binIndex = 0.0;
    ${binConditions} else {
      binIndex = ${lastBinIndex}.0;
    }

    float rescaled = (binIndex + 0.5) / ${colormapLength}.0; // +0.5 to center the bin and avoid potential interpolation.
    gl_FragColor = texture2D(colormap, vec2(rescaled, 1.0));
    gl_FragColor.a = opacity;
    gl_FragColor.rgb *= gl_FragColor.a;
  `
}

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const riskConfig = useStore((state) => state.riskConfig)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormapCount =
    colorLimits.type === 'discrete' ? colorLimits.binBoundaries.length : 256
  const colormap = useColormapRGB(riskConfig.colormap, {
    count: colormapCount,
  })
  const [zoom, setZoom] = useState(map?.getZoom() ?? 0)

  useEffect(() => {
    if (!map) return
    const handleZoom = () => {
      setZoom(map.getZoom())
    }
    setZoom(map.getZoom())
    map.on('zoom', handleZoom)
    return () => {
      map.off('zoom', handleZoom)
    }
  }, [map])

  const opacity = useMemo(() => {
    // return 1
    if (zoom < 13) return 1
    if (zoom >= 13.25) return 0
    return 1 - (zoom - 13) / (13.25 - 13)
  }, [zoom])

  const fragShader = useMemo(
    () =>
      createFragShader(
        'wind_risk_2011',
        colorLimits.type === 'discrete',
        colorLimits.binBoundaries,
        colormapCount,
      ),
    [colorLimits.type, colorLimits.binBoundaries, colormapCount],
  )

  return (
    <MapProvider map={map}>
      <Raster
        colormap={colormap}
        clim={colorLimits.bounds}
        mode={'texture'}
        source={
          'https://carbonplan-scratch.s3.us-west-2.amazonaws.com/ndpyramid/combined_12_512.zarr'
        }
        variable={'wind_risk_2011'}
        fillValue={NaN}
        frag={fragShader}
        opacity={opacity}
      />
    </MapProvider>
  )
}

export default ZarrLayer
