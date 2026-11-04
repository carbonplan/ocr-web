import { useMemo, useEffect, useRef } from 'react'
import { useColormap } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
import { ZarrLayer as ZarrLayerClass } from '@carbonplan/zarr-layer'
import {
  getMapLayer,
  getUnitScale,
  resolveHazardDataset,
  resolveLayerVariable,
} from '@/lib/hazards'
import { getZarrLayerId } from '@/lib/raster-query'
import { openIcechunkStore } from '@/lib/icechunk'

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
  const activeLayer = getMapLayer(riskConfig, mapLayerId)
  const dataset = resolveHazardDataset(riskConfig, { timePeriod, futureWindow })
  const variable = resolveLayerVariable(riskConfig, mapLayerId, {
    timePeriod,
    futureWindow,
  })
  const unitScale = getUnitScale(riskConfig, mapLayerId)
  const categorical = activeLayer?.categorical ?? false
  const validRange = activeLayer?.validRange
  const continuous = activeLayer?.continuous ?? false
  const selectorDim = activeLayer?.selector?.dim
  const selectorValue = useStore((state) =>
    selectorDim ? state.selectorValues[selectorDim] : null,
  )
  const layerRef = useRef<ZarrLayerClass | null>(null)

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

    const outOfRange = validRange
      ? ` || ${variable} < ${validRange[0].toFixed(6)} || ${variable} > ${validRange[1].toFixed(6)}`
      : ''

    if (continuous) {
      const [lo, hi] = [boundaries[0], boundaries[boundaries.length - 1]]
      const n = colormap.length
      return `
      float value = ${valueExpression};
      if (isnan(value)${outOfRange}) {
        discard;
      }
      float t = clamp((value - ${lo.toFixed(6)}) / ${(hi - lo).toFixed(6)}, 0.0, 1.0);
      // skip the leading no-data swatch and land on sample centers
      float coord = (1.5 + t * ${(n - 2).toFixed(1)}) / ${n.toFixed(1)};
      vec4 c = texture(colormap, vec2(coord, 0.5));
      fragColor = vec4(c.rgb * opacity, opacity);
    `
    }

    return `
      float value = ${valueExpression};
      if (isnan(value)${categorical ? '' : ' || value == 0.0'}${outOfRange}) {
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
  }, [
    colorLimits.binBoundaries,
    variable,
    unitScale,
    categorical,
    validRange,
    continuous,
    colormap.length,
  ])

  useEffect(() => {
    if (!map) return

    const layerId = getZarrLayerId(dataset.source, variable)
    let cancelled = false

    const addLayer = async () => {
      const store =
        dataset.store === 'icechunk'
          ? await openIcechunkStore(dataset.source)
          : undefined
      if (cancelled) return

      const layer = new ZarrLayerClass({
        id: layerId,
        ...(store ? { store } : { source: dataset.source }),
        variable,
        ...(selectorDim && typeof selectorValue === 'number'
          ? { selector: { [selectorDim]: selectorValue } }
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
    }

    setZarrLoading(true)
    addLayer().catch((err) => {
      if (cancelled) return
      console.error('failed to open raster store', err)
      setZarrLoading(false)
    })

    return () => {
      cancelled = true
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
      layerRef.current = null
      setZarrLayer(null)
      setZarrLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, customFrag, dataset.source, dataset.store])

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
