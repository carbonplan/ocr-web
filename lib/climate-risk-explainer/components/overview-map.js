import { Minimap, Raster, useMinimap } from '@carbonplan/minimaps'
import { Box } from 'theme-ui'
import { useState, useMemo } from 'react'
import { Colorbar, Column, Filter, Row } from '@carbonplan/components'
import { Chart, AxisLabel } from '@carbonplan/charts'
import { geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import useMakeColormap from './make-colormap'
import statesData from './data/states.json'
import geoAlbers from './geoAlbers'

const states = feature(statesData, statesData.objects.states)

const StatePaths = () => {
  const { projection } = useMinimap()

  const statePaths = useMemo(() => {
    if (!projection) return null

    const path = geoPath(projection)

    return states.features.map((f, i) => (
      <Box
        as='path'
        key={`state-${i}`}
        d={path(f)}
        sx={{
          fill: 'none',
          stroke: 'secondary',
          strokeWidth: 1,
        }}
      />
    ))
  }, [projection])

  return <g>{statePaths}</g>
}

const VARIABLES = {
  current: 'wind_risk_2011',
  future: 'wind_risk_2047',
}
const CLIM = [0, 2.5]
const BOUNDS = {
  lat: [22.4897130033103, 52.30352043580055],
  lon: [-128.310557749823, -64.24783103538115],
}

const p = geoAlbers().fitSize([Math.PI * 2, Math.PI], states)
const translate = [
  p.translate()[0] / Math.PI - 1,
  (2 * p.translate()[1]) / Math.PI - 1,
]
const OverviewMap = () => {
  const [map, setMap] = useState('current')
  const colormap = useMakeColormap()

  return (
    <Box sx={{ pb: [2, 2, 2, 3] }}>
      <Filter
        values={{
          current: map === 'current',
          future: map === 'future',
        }}
        labels={{
          current: 'Current climate',
          future: 'Future climate',
        }}
        setValues={(obj) => setMap(Object.keys(obj).find((k) => obj[k]))}
      />
      <Box
        sx={{
          display: 'block',
          width: '100%',
          position: 'relative',
          mt: 2,
        }}
      >
        <Minimap
          projection={geoAlbers}
          scale={8.7}
          translate={translate}
          aspect={0.7}
        >
          <StatePaths />
          <Raster
            clim={CLIM}
            mode='lut'
            nullValue={9.969209968386869e36}
            source='https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/tensor/web-figures/store1.zarr'
            bounds={BOUNDS}
            variable={VARIABLES[map]}
            colormap={colormap}
            // frag={`
            // float rps = value.x;
            // if (rps == nullValue || rps < 0.01 ) {
            //   discard;
            //   return;
            // }

            // vec4 c;
            // float rescaled = (rps - clim.x)/(clim.y - clim.x);
            // c = texture2D(lut, vec2(rescaled, 1.0));
            // gl_FragColor = vec4(c.x, c.y, c.z, 1.0);
            // `}
          />
        </Minimap>
        <Row columns={6} sx={{ mt: 4 }}>
          <Column start={3} width={4}>
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
    </Box>
  )
}

export default OverviewMap
