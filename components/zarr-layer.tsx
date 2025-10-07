import { useColormapRGB } from '@/lib/colormaps'
import { useStore } from '@/lib/store'
// @ts-expect-error - carbonplan maps types not available
import { MapProvider, Raster } from '@carbonplan/maps/core'

const frag = (variable: string) => `
  if (${variable} == fillValue) {
    discard;
    return;
  }

  float value = ${variable};

  if (value < clim.x) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float rescaled = (value - clim.x) / (clim.y - clim.x);
  gl_FragColor = texture2D(colormap, vec2(rescaled, 1.0));
  gl_FragColor.a = opacity;
  gl_FragColor.rgb *= gl_FragColor.a;
`

const ZarrLayer = () => {
  const map = useStore((state) => state.map)
  const riskConfig = useStore((state) => state.riskConfig)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormapRGB(riskConfig.colormap, {
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
        frag={frag('USFS_RPS')}
      />
    </MapProvider>
  )
}

export default ZarrLayer
