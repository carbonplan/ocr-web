import { useMemo, useEffect, useRef } from 'react'
import { useColormap } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
import { ZarrLayer as ZarrLayerClass } from '@carbonplan/zarr-layer'
import { getMapLayer, resolveHazardDataset } from '@/lib/hazards'
import { getZarrLayerId } from '@/lib/raster-query'

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormap()
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const riskConfig = useStore((state) => state.riskConfig)
  const setZarrLoading = useStore((state) => state.setZarrLoading)
  const setZarrLayer = useStore((state) => state.setZarrLayer)
  const mapLayerId = useStore((state) => state.mapLayer)
  const selectorValue = useStore((state) => state.mapLayerSelectorValue)
  const layerRef = useRef<ZarrLayerClass | null>(null)

  const activeLayer = getMapLayer(riskConfig, mapLayerId)
  const dataset = resolveHazardDataset(riskConfig, { timePeriod, futureWindow })
  const variable = activeLayer?.variable ?? dataset.variable
  const unitScale = activeLayer?.unitScale ?? riskConfig.unitScale
  const selectorDim = activeLayer?.selector?.dim

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
      unitScale === 1 ? variable : `${variable} * ${unitScale.toFixed(6)}`

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
  }, [colorLimits.binBoundaries, variable, unitScale])

  useEffect(() => {
    if (!map) return

    const layerId = getZarrLayerId(dataset.source, variable)
    const layer = new ZarrLayerClass({
      id: layerId,
      source: dataset.source,
      variable,
      ...(selectorDim
        ? {
            selector: {
              [selectorDim]:
                useStore.getState().mapLayerSelectorValue ??
                activeLayer!.selector!.defaultValue,
            },
          }
        : {}),
      colormap,
      clim: colorLimits.bounds,
      customFrag,
      opacity: 1,
      onLoadingStateChange: (state) => {
        setZarrLoading(state.loading)
        // a static map won't repaint on its own once chunk loads land
        map.triggerRepaint()
      },
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
    if (!selectorDim || selectorValue === null) return
    layerRef.current?.setSelector({ [selectorDim]: selectorValue })
  }, [selectorDim, selectorValue])

  return null
}

export default ZarrLayer
