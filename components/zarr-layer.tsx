import { useMemo, useEffect, useRef } from 'react'
import { useColormap } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
import { ZarrLayer as ZarrLayerClass } from '@carbonplan/zarr-layer'
import { resolveHazardDataset } from '@/lib/hazards'

const LAYER_ID = 'zarr-raster-layer'

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormap()
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const riskConfig = useStore((state) => state.riskConfig)
  const riskRaster = useStore((state) => state.riskRaster)
  const setZarrLoading = useStore((state) => state.setZarrLoading)
  const setZarrLayer = useStore((state) => state.setZarrLayer)
  const layerRef = useRef<ZarrLayerClass | null>(null)

  const dataset = resolveHazardDataset(riskConfig, { timePeriod, futureWindow })

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

    // bin boundaries are in display units; scale raw store values to match
    const valueExpression =
      riskConfig.unitScale === 1
        ? dataset.variable
        : `${dataset.variable} * ${riskConfig.unitScale.toFixed(1)}`

    return `
      float value = ${valueExpression};
      if (isnan(value) || value == 0.0) {
        discard;
      }
      float binIndex = 0.0;
      ${binConditions} else {
        binIndex = ${lastBinIndex}.0;
      }
      // Offset by 1 to match buildings layer which uses colormap[i+1] for bin i
      // +0.5 to center the bin in the colormap
      float rescaled = (binIndex + 1.5) / ${boundaries.length + 1}.0;
      vec4 c = texture(colormap, vec2(clamp(rescaled, 0.0, 1.0), 0.5));
      fragColor = vec4(c.rgb * opacity, opacity);
    `
  }, [colorLimits.binBoundaries, dataset.variable, riskConfig.unitScale])

  useEffect(() => {
    if (!map) return

    // unique id per dataset: removing and re-adding a custom layer under the
    // same id in one frame leaves the new layer uninitialized
    const layerId = `${LAYER_ID}-${dataset.source.split('/').pop()}-${dataset.variable}`
    const layer = new ZarrLayerClass({
      id: layerId,
      source: dataset.source,
      variable: dataset.variable,
      colormap,
      clim: colorLimits.bounds,
      customFrag,
      opacity: useStore.getState().riskRaster ? 1 : 0,
      onLoadingStateChange: (state) => setZarrLoading(state.loading),
      ...(riskConfig.rasterOptions ?? {}),
    })

    layerRef.current = layer
    map.addLayer(layer, 'hillshade')
    map.triggerRepaint()
    setZarrLayer(layer)

    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
      layerRef.current = null
      setZarrLayer(null)
      setZarrLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, customFrag, dataset.source])

  useEffect(() => {
    layerRef.current?.setColormap(colormap)
  }, [colormap])

  useEffect(() => {
    layerRef.current?.setClim(colorLimits.bounds)
  }, [colorLimits.bounds])

  useEffect(() => {
    layerRef.current?.setOpacity(riskRaster ? 1 : 0)
  }, [riskRaster])

  return null
}

export default ZarrLayer
