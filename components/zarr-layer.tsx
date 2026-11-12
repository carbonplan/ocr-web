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
import { openIcechunkStore } from '@/lib/icechunk'
import { buildBinFrag } from '@/lib/bin-frag'

// Unique per dataset because removing and re-adding a custom layer under one id
// in a single frame leaves the new layer uninitialized.
const getZarrLayerId = (source: string, variable: string): string =>
  `zarr-raster-layer-${source.split('/').pop()}-${variable}`

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormap()
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const riskConfig = useStore((state) => state.riskConfig)
  const setZarrLoading = useStore((state) => state.setZarrLoading)
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

  const customFrag = useMemo(
    () =>
      buildBinFrag(colorLimits.binBoundaries || [], variable, unitScale, {
        categorical,
        validRange,
        continuous,
        colormapLength: colormap.length,
      }),
    [
      colorLimits.binBoundaries,
      variable,
      unitScale,
      categorical,
      validRange,
      continuous,
      colormap.length,
    ],
  )

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
        onLoadingStateChange: (state) => setZarrLoading(state.loading),
        ...(riskConfig.rasterOptions ?? {}),
      })

      layerRef.current = layer
      map.addLayer(layer, 'hillshade')
      map.triggerRepaint()
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
