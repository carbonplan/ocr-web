import { useMemo } from 'react'
import { Minimap, Raster, useMinimap } from '@carbonplan/minimaps'
import { equirectangular } from '@carbonplan/minimaps/projections'
import { Box, useThemeUI } from 'theme-ui'
import { Colorbar, Column, Row } from '@carbonplan/components'
import { Chart, AxisLabel } from '@carbonplan/charts'
import { geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import streetsTopo from './data/streets.json'
import useMakeColormap from './make-colormap'

const streets = feature(streetsTopo, streetsTopo.objects.streets)

const BOUNDS = {
  lat: [34.095057, 34.164079],
  lon: [-118.348119, -118.249667],
}

const CLIM = [0, 1]

const deg2rad = (deg) => (deg * Math.PI) / 180
const getViewParameters = (crop) => {
  const lonSpan = deg2rad(crop.lon[1] - crop.lon[0])
  const latSpan = deg2rad(crop.lat[1] - crop.lat[0])

  const scaleX = (2 * Math.PI) / lonSpan
  const scaleY = Math.PI / latSpan
  const scale = Math.min(scaleX, scaleY)

  const lonCenter = deg2rad((crop.lon[0] + crop.lon[1]) / 2)
  const latCenter = deg2rad((crop.lat[0] + crop.lat[1]) / 2)

  return {
    scale,
    translate: [
      (-lonCenter * scale) / Math.PI,
      (latCenter * (2 * scale)) / Math.PI,
    ],
  }
}

const { scale, translate } = getViewParameters(BOUNDS)

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
    ml: '-21%',
  },
}

const cityLabelCoordinates = {
  lon: -118.264,
  lat: 34.096,
}

const placeLabelCoordinates = {
  lon: -118.295,
  lat: 34.133823,
}

const StreetsPath = ({ stroke, strokeWidth, opacity }) => {
  const { projection } = useMinimap() || {}

  const pathGenerator = useMemo(() => {
    return projection ? geoPath(projection) : null
  }, [projection])

  return (
    <>
      {streets.features.map((feature, i) => {
        const d = pathGenerator(feature)
        if (!d) return null
        return (
          <path
            key={i}
            d={d}
            stroke={stroke}
            opacity={opacity}
            fill='none'
            strokeWidth={strokeWidth}
            style={{
              vectorEffect: 'non-scaling-stroke',
            }}
          />
        )
      })}
    </>
  )
}

const PointLabel = ({ coords, label, color = 'secondary' }) => {
  const minimap = useMinimap()
  const projection = minimap?.projection
  const { lon, lat } = coords

  if (!projection) return null

  const [x, y] = projection([lon, lat])
  if (!x || !y) return null

  return (
    <Box
      as='text'
      sx={{
        fontFamily: 'mono',
        letterSpacing: 'mono',
        fill: color,
        fontSize: 4,
        pointerEvents: 'none',
        textAnchor: 'middle',
      }}
      x={x}
      y={y}
    >
      {label}
    </Box>
  )
}

const MapPanel = ({ label, variable }) => {
  const { theme } = useThemeUI()
  const colormap = useMakeColormap()

  return (
    <>
      <Box sx={sx.label}>{label}</Box>
      <Box sx={sx.panel}>
        <Minimap
          projection={equirectangular}
          scale={scale}
          translate={translate}
        >
          <StreetsPath
            stroke={theme.colors?.secondary || theme.colors?.muted || '#666'}
            opacity={0.3}
            strokeWidth={0.5}
          />

          <Raster
            clim={CLIM}
            mode='lut'
            nullValue={9.969209968386869e36}
            source='https://carbonplan-ocr.s3.amazonaws.com/output/fire-risk/tensor/web-figures/store3-griff13.zarr'
            bounds={BOUNDS}
            variable={variable}
            colormap={colormap}
          />

          <PointLabel coords={cityLabelCoordinates} label='Los Angeles' />

          <PointLabel
            coords={placeLabelCoordinates}
            label='Griffith Park'
            color='primary'
          />
        </Minimap>
      </Box>
    </>
  )
}

const WindComparison = () => {
  const colormap = useMakeColormap()

  return (
    <Box sx={{ pb: [2, 2, 2, 3] }}>
      <Row columns={6}>
        <Column start={1} width={3}>
          <MapPanel label='Scott 2024' variable='USFS_RPS' />
        </Column>
        <Column start={4} width={3}>
          <MapPanel label='Our method' variable='wind_risk_2011' />
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
