import { useColormap } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
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
        clim={[0, 25]}
        mode={'texture'}
        source={
          'https://carbonplan-scratch.s3.us-west-2.amazonaws.com/ndpyramid-test/conustest_12lvl.zarr'
        }
        variable={'risk_2011'}
      />
    </MapProvider>
  )
}

export default ZarrLayer
