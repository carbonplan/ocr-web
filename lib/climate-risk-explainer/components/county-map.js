import { Box, useThemeUI } from 'theme-ui'
import { Column, Filter, Row } from '@carbonplan/components'
import { useEffect, useState } from 'react'
import { geoPath, geoAlbers } from 'd3-geo'
import { feature } from 'topojson-client'
import data from './county-stats.json'
import ScoreBar from './score-bar'
import { BIN_BOUNDARIES, useColormap } from './use-colormap'

const getColor = (score, colormap) => {
  let index
  if (score === 0) {
    return null
  } else if (score < BIN_BOUNDARIES[1]) {
    index = 0
  } else {
    index =
      BIN_BOUNDARIES.findIndex((boundary, i) =>
        i === BIN_BOUNDARIES.length - 1 ? true : score < boundary
      ) - 1
  }

  return colormap[index]
}

const CountyMap = () => {
  const [variable, setVariable] = useState('current')
  const [path, setPath] = useState(null)
  const [features, setFeatures] = useState([])
  const { theme } = useThemeUI()
  const colormap = useColormap()

  useEffect(() => {
    const geo = feature(data, data.objects.counties)

    const projection = geoAlbers().fitSize([980, 610], geo)
    setFeatures(geo.features)
    setPath(() => geoPath(projection))
  }, [])

  return (
    <Box sx={{ pb: [2, 2, 2, 3] }}>
      <Filter
        values={{
          current: variable === 'current',
          future: variable === 'future',
        }}
        labels={{
          current: 'Current climate',
          future: 'Future climate',
        }}
        setValues={(obj) => setVariable(Object.keys(obj).find((k) => obj[k]))}
      />
      <Box sx={{ display: 'block', width: '100%', position: 'relative' }}>
        <Box
          as='svg'
          viewBox='0 0 980 610'
          sx={{
            mt: 2,
            fill: 'none',
            strokeWidth: '1',
            stroke: 'primary',
          }}
        >
          <g strokeLinejoin='round' strokeLinecap='round'>
            {path &&
              features.map((f, i) => {
                const key =
                  variable === 'current'
                    ? 'median_wind_risk_2011'
                    : 'median_wind_risk_2047'
                const median = f.properties[key]
                return (
                  <path
                    key={i}
                    d={path(f)}
                    fill={getColor(median, colormap) ?? theme.colors.muted}
                    stroke={theme.colors.primary}
                  />
                )
              })}
          </g>
        </Box>
        <Row columns={6} sx={{ mt: 4 }}>
          <Column start={3} width={4}>
            <ScoreBar axisLabel='Median risk of loss' />
          </Column>
        </Row>
      </Box>
    </Box>
  )
}

export default CountyMap
