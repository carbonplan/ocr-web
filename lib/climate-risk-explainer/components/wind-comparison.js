import { Minimap, Raster, Path } from '@carbonplan/minimaps'
import { equirectangular } from '@carbonplan/minimaps/projections'
import { Box, useThemeUI } from 'theme-ui'
import { Colorbar, Column, Row } from '@carbonplan/components'
import { Chart, AxisLabel } from '@carbonplan/charts'
import { useThemedColormap } from '@carbonplan/colormaps'

const BOUNDS = {
  lat: [34.14, 34.23],
  lon: [-118.18, -118.06],
}
const CROP = {
  lat: [34.15, 34.2],
  lon: [-118.12, -118.09],
}

const CLIM = [0, 2.5]

const f = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [CROP.lon[0], CROP.lat[0]],
      [CROP.lon[1], CROP.lat[1]],
    ],
  },
}
const p = equirectangular().fitSize([Math.PI, Math.PI], f)
const scale = p.scale()
const translate = [
  p.translate()[0] / Math.PI - 1,
  (2 * p.translate()[1]) / Math.PI - 1,
]

const sx = {
  label: {
    textAlign: 'center',
    fontFamily: 'mono',
    letterSpacing: 'mono',
    textTransform: 'uppercase',
    mb: 1,
  },
  panel: {
    position: 'relative',
    width: '142%',
  },
}

const WindComparison = () => {
  const { theme } = useThemeUI()
  const colormap = useThemedColormap('fire')

  return (
    <Box sx={{ pb: [2, 2, 2, 3] }}>
      <Row columns={6}>
        <Column start={1} width={3}>
          <Box sx={sx.label}>Scott 2024</Box>
          <Box sx={sx.panel}>
            <Minimap
              projection={equirectangular}
              scale={scale}
              translate={translate}
            >
              <Path
                stroke={theme.colors.primary}
                source={
                  'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'
                }
                feature={'land'}
                opacity={1}
              />

              <Raster
                clim={CLIM}
                mode='lut'
                nullValue={9.969209968386869e36}
                source='https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/tensor/web-figures/store3.zarr'
                bounds={BOUNDS}
                variable={'USFS_RPS'}
                colormap={colormap}
              />
            </Minimap>
          </Box>
        </Column>
        <Column start={4} width={3}>
          <Box sx={sx.label}>Our method</Box>
          <Box sx={sx.panel}>
            <Minimap
              projection={equirectangular}
              scale={scale}
              translate={translate}
            >
              <Path
                stroke={theme.colors.primary}
                source={
                  'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'
                }
                feature={'land'}
                opacity={1}
              />

              <Raster
                clim={CLIM}
                mode='lut'
                nullValue={9.969209968386869e36}
                source='https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/tensor/web-figures/store3.zarr'
                bounds={BOUNDS}
                variable={'wind_risk_2011'}
                colormap={colormap}
              />
            </Minimap>
          </Box>
        </Column>
      </Row>
      <Row columns={6} sx={{ mt: 4 }}>
        <Column start={4} width={3}>
          <Colorbar horizontal clim={CLIM} colormap={colormap} width='100%' />
          <Box sx={{ width: '100%', mt: '20px', pb: 1 }}>
            <Chart x={[0, 1]} y={[0, 1]}>
              <AxisLabel bottom units='%'>
                Risk of loss
              </AxisLabel>
            </Chart>
          </Box>
        </Column>
      </Row>
    </Box>
  )
}

export default WindComparison
