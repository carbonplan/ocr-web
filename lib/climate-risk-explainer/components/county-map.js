import { Box } from 'theme-ui'
import { Filter } from '@carbonplan/components'
import { useEffect, useState, useMemo } from 'react'
import { geoPath, geoAlbers } from 'd3-geo'
import { feature } from 'topojson-client'
import data from './data/county-stats.json'
import greatLakesData from './data/great-lakes.json'
import statesData from './data/states.json'

const greatLakes = feature(
  greatLakesData,
  greatLakesData.objects['great-lakes']
)
const states = feature(statesData, statesData.objects.states)

const SCORE_THRESHOLD = 7
const SPIKE_SCALE = 1 / 2500

const CountyMap = () => {
  const [variable, setVariable] = useState('current')
  const [path, setPath] = useState(null)
  const [features, setFeatures] = useState([])

  const spike = (length) => `M-3,0L0,${-length}L3,0`

  useEffect(() => {
    const geo = feature(data, data.objects.counties)
    const proj = geoAlbers().fitSize([980, 700], geo)
    setFeatures(geo.features)
    setPath(() => geoPath(proj))
  }, [])

  const countyPaths = useMemo(() => {
    if (!path) return null
    return features.map((f, i) => (
      <Box
        as='path'
        key={`county-${i}`}
        d={path(f)}
        sx={{
          fill: 'none',
          stroke: 'muted',
          strokeWidth: 1,
        }}
      />
    ))
  }, [path, features])

  const greatLakesPaths = useMemo(() => {
    if (!path) return null
    return greatLakes.features.map((f, i) => (
      <Box
        as='path'
        key={`lake-${i}`}
        d={path(f)}
        sx={{
          fill: 'background',
          strokeWidth: 1,
        }}
      />
    ))
  }, [path])

  const statePaths = useMemo(() => {
    if (!path) return null
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
  }, [path])

  const spikeElements = useMemo(() => {
    if (!path) return null

    const histKey =
      variable === 'current' ? 'wind_risk_2011_hist' : 'wind_risk_2047_hist'

    return features.map((f, i) => {
      const [cx, cy] = path.centroid(f) || []
      const hist = f.properties[histKey] || []
      const count = hist.slice(SCORE_THRESHOLD).reduce((sum, v) => sum + v, 0)

      if (!count) return null
      const height = count * SPIKE_SCALE

      return (
        <Box
          as='path'
          key={`spike-${i}`}
          transform={`translate(${cx},${cy})`}
          d={spike(height)}
          sx={{
            fillOpacity: 0.1,
            strokeOpacity: 1,
            strokeWidth: 1,
            stroke: 'red',
            fill: 'red',
          }}
        />
      )
    })
  }, [features, path, variable])

  const legend = useMemo(() => {
    const legendData = [
      { value: 1000, label: '1k+' },
      { value: 100000, label: '100k' },
      { value: 200000, label: '200k' },
    ]

    const baseX = 60
    const baseY = 585
    const spacing = 60

    return legendData.map((item, i) => {
      const height = item.value * SPIKE_SCALE
      const x = baseX + i * spacing
      return (
        <g key={`legend-${i}`}>
          <Box
            as='path'
            transform={`translate(${x},${baseY})`}
            d={spike(height)}
            sx={{
              fillOpacity: 0.4,
              strokeOpacity: 1,
              strokeWidth: 1,
              stroke: 'red',
              fill: 'red',
            }}
          />
          <Box
            as='text'
            x={x}
            y={baseY + 20}
            sx={{
              fontFamily: 'mono',
              letterSpacing: 'mono',
              fontSize: 3,
              textAnchor: 'middle',
              fill: 'secondary',
            }}
          >
            {item.label}
          </Box>
        </g>
      )
    })
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
        setValues={(obj) => {
          const key = Object.keys(obj).find((k) => obj[k])
          setVariable(key || 'current')
        }}
      />
      <Box sx={{ display: 'block', width: '100%', position: 'relative' }}>
        <Box as='svg' viewBox='0 0 980 700' sx={{ mt: 2 }}>
          <g strokeLinejoin='round' strokeLinecap='round'>
            {countyPaths}
          </g>
          <g strokeLinejoin='round' strokeLinecap='round'>
            {greatLakesPaths}
          </g>
          <g strokeLinejoin='round' strokeLinecap='round'>
            {statePaths}
          </g>
          <g>{spikeElements}</g>
          <g>{legend}</g>
          <g>
            <Box
              as='text'
              x={45}
              y={640}
              textAnchor='start'
              sx={{
                fontFamily: 'mono',
                letterSpacing: 'mono',
                textTransform: 'uppercase',
                fontSize: 4,
                fill: 'primary',
              }}
            >
              Number buildings
            </Box>
            <Box
              as='text'
              x={45}
              y={670}
              textAnchor='start'
              sx={{
                fontFamily: 'mono',
                letterSpacing: 'mono',
                textTransform: 'uppercase',
                fontSize: 4,
                fill: 'primary',
              }}
            >
              with risk score {'>'} {SCORE_THRESHOLD - 1}
            </Box>
          </g>
        </Box>
      </Box>
    </Box>
  )
}

export default CountyMap
