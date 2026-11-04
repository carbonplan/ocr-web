import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { getMapLayer } from '@/lib/hazards'

// mirrors the raster shader: the first bin whose upper edge the value clears,
// with the last bin left open-ended. Bin i is colormap[i + 1], since the
// colormap leads with a no-data swatch.
export const getBinIndex = (bins: number[], value: number) =>
  bins.findIndex((_, i) => i === bins.length - 1 || value < bins[i + 1])

/** The color map layer `id` paints `value` (in display units) with. */
export const useLayerColor = (id: string, value: number | null) => {
  const bins = useStore(
    (state) => getMapLayer(state.riskConfig, id)?.binBoundaries,
  )
  const colormap = useColormap({ count: bins?.length })
  return !value || !bins ? undefined : colormap[getBinIndex(bins, value) + 1]
}
