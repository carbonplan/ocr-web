import { useMemo, useEffect, useRef } from 'react'
import { useColormap } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
import { ZarrLayer as ZarrLayerClass } from '@carbonplan/zarr-layer'
import { DATA_URLS } from '@/lib/config'

const LAYER_ID = 'zarr-raster-layer'
const FILL_VALUE = 9.969209968386869e36

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormap()
  const timePeriod = useStore((state) => state.timePeriod)
  const setZarrLoading = useStore((state) => state.setZarrLoading)
  const layerRef = useRef<ZarrLayerClass | null>(null)

  const riskAttribute = timePeriod === 'current' ? 'rps_2011' : 'rps_2047'

  const customFrag = useMemo(() => {
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
      if (value == fillValue || value == 0.0) {
        fragColor = vec4(0.0);
        return;
      }
      float binIndex = 0.0;
      ${binConditions} else {
        binIndex = ${lastBinIndex}.0;
      }
      // Offset by 1 to match buildings layer which uses colormap[i+1] for bin i
      // +0.5 to center the bin in the colormap
      float rescaled = (binIndex + 1.5) / ${boundaries.length + 1}.0;
      vec4 c = texture(colormap, vec2(clamp(rescaled, 0.0, 1.0), 0.5));
      fragColor = vec4(c.rgb, opacity);
    `
  }, [colorLimits.binBoundaries, riskAttribute])

  useEffect(() => {
    if (!map) return

    const layer = new ZarrLayerClass({
      id: LAYER_ID,
      source: DATA_URLS.raster,
      variable: riskAttribute,
      colormap,
      clim: colorLimits.bounds,
      fillValue: FILL_VALUE,
      customFrag,
      onLoadingStateChange: (state) => setZarrLoading(state.loading),
      zarrVersion: 3,
      bounds: [
        -128.3875562194317, 22.428114227623336, -64.05348689808879,
        52.4818488914143,
      ],
      latIsAscending: true,
    })

    layerRef.current = layer
    map.addLayer(layer, 'hillshade')

    return () => {
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID)
      }
      layerRef.current = null
      setZarrLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, customFrag])

  useEffect(() => {
    layerRef.current?.setColormap(colormap)
  }, [colormap])

  useEffect(() => {
    layerRef.current?.setClim(colorLimits.bounds)
  }, [colorLimits.bounds])

  return null
}

export default ZarrLayer
