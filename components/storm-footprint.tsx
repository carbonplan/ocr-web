import { useEffect, useMemo, useRef } from 'react'
import { ZarrLayer as ZarrLayerClass } from '@carbonplan/zarr-layer'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { HISTORIC_URLS } from '@/lib/config'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { HISTORIC_STORMS_LAYER_ID } from '@/lib/historic-events'
import { buildBinFrag } from '@/lib/bin-frag'

const VARIABLE = 'footprint'
const BEFORE_ID = 'hillshade'
const LAYER = getMapLayer(RISKS.wind, HISTORIC_STORMS_LAYER_ID)!

// The selected storm's modeled wind field, drawn from the per-storm chunks of
// the wind store on the Saffir-Simpson scale of the Previous storms layer.
const StormFootprint = () => {
  const map = useStore((state) => state.map)
  const active = useStore(
    (state) =>
      state.riskConfig.id === 'wind' &&
      state.mapLayer === HISTORIC_STORMS_LAYER_ID,
  )
  const stormIndex = useStore((state) => {
    if (
      !state.selectedStormId ||
      state.historicEvents.status !== 'success' ||
      state.historicEvents.kind !== 'storms'
    ) {
      return null
    }
    const storm = state.historicEvents.events.find(
      (event) => event.sid === state.selectedStormId,
    )
    return storm ? storm.index : null
  })
  const setZarrLoading = useStore((state) => state.setZarrLoading)
  const colormap = useColormap({ count: LAYER.binBoundaries.length })
  const layerRef = useRef<ZarrLayerClass | null>(null)

  const customFrag = useMemo(
    () => buildBinFrag(LAYER.binBoundaries, VARIABLE, LAYER.unitScale),
    [],
  )

  useEffect(() => {
    if (!map || !active || stormIndex === null) return
    const id = `storm-footprint-${stormIndex}`
    const layer = new ZarrLayerClass({
      id,
      source: HISTORIC_URLS.stormWinds,
      variable: VARIABLE,
      selector: { storm: { selected: stormIndex, type: 'index' } },
      colormap,
      clim: [
        LAYER.binBoundaries[0],
        LAYER.binBoundaries[LAYER.binBoundaries.length - 1],
      ],
      customFrag,
      opacity: 0.85,
      zarrVersion: 3,
      onLoadingStateChange: (state) => {
        setZarrLoading(state.loading)
        map.triggerRepaint()
      },
    })
    layerRef.current = layer
    map.addLayer(layer, map.getLayer(BEFORE_ID) ? BEFORE_ID : undefined)
    map.triggerRepaint()
    return () => {
      if (map.getLayer(id)) map.removeLayer(id)
      layerRef.current = null
      setZarrLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, active, stormIndex, customFrag])

  useEffect(() => {
    layerRef.current?.setColormap(colormap)
  }, [colormap])

  return null
}

export default StormFootprint
