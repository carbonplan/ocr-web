import { useMemo, useEffect, useRef } from 'react'
import { useColormap } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
import { ZarrLayer as ZarrLayerClass } from '@carbonplan/zarr-layer'
import { getMapLayer, getUnitScale, resolveHazardDataset } from '@/lib/hazards'
import { getZarrLayerId } from '@/lib/raster-query'
import { buildBinFrag } from '@/lib/bin-frag'

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
  const variable = activeLayer?.variable ?? dataset.variable
  const unitScale = getUnitScale(riskConfig, mapLayerId)
  const selectorDim = activeLayer?.selector?.dim
  const selectorValue = useStore((state) =>
    selectorDim ? state.selectorValues[selectorDim] : null,
  )
  const layerRef = useRef<ZarrLayerClass | null>(null)

  const customFrag = useMemo(
    () => buildBinFrag(colorLimits.binBoundaries || [], variable, unitScale),
    [colorLimits.binBoundaries, variable, unitScale],
  )

  useEffect(() => {
    if (!map) return

    const layerId = getZarrLayerId(dataset.source, variable)
    const layer = new ZarrLayerClass({
      id: layerId,
      source: dataset.source,
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
