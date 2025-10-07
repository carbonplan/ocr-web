import { useColormap } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
// @ts-expect-error - carbonplan maps types not available
import { MapProvider, Raster } from '@carbonplan/maps/core'

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const riskConfig = useStore((state) => state.riskConfig)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormap(riskConfig.colormap, {
    format: 'rgb',
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  return (
    <MapProvider map={map}>
      <Raster
        colormap={colormap}
        clim={colorLimits.bounds}
        mode={'texture'}
        source={
          'https://carbonplan-scratch.s3.us-west-2.amazonaws.com/pyr/single_var_clipped_11_512.zarr'
        }
        variable={'USFS_RPS'}
        fillValue={NaN}
      />
    </MapProvider>
  )
}

export default ZarrLayer
