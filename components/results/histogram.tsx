import { useMemo } from 'react'
import {
  Bar,
  Chart,
  Grid,
  Plot,
  Label,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import { Box, ThemeUIStyleObject } from 'theme-ui'
import { format } from 'd3-format'
import ScoreBar from './score-bar'

export const formatBuildingCount = (value: number) => {
  const abs = Math.abs(value)
  if (abs === 0) {
    return '0'
  } else if (abs < 1000) {
    // e.g., 6, 464, etc.
    return format('.0f')(value)
  } else if (abs < 100000) {
    // e.g., 5.4K, 32K, etc.
    return format('0.2s')(value)
  } else if (abs < 1000000) {
    // e.g., 194K
    return format('0.3s')(value)
  } else if (abs < 100000000) {
    // e.g., 2.7M
    return format('0.2s')(value)
  } else {
    // e.g., 101M
    return format('0.3s')(value)
  }
}

const getColorForBar = (count: number, index: number, score: string | null) => {
  if (String(index) === score) {
    return 'primary'
  } else if (count === 0) {
    return 'muted'
  } else if (score == null) {
    return 'primary'
  } else {
    return 'secondary'
  }
}

const Histogram = ({
  data,
  region,
  score,
  sx,
}: {
  score: string | null
  region: string
  data: number[]
  sx?: ThemeUIStyleObject
}) => {
  const maxCount: number = useMemo(() => Math.max(...data, 1), [data])
  const totalBuildings = useMemo(() => data.reduce((a, b) => a + b, 0), [data])
  const screenReaderDescription = useMemo(() => {
    const distribution = data
      .map((count, i) => {
        if (count === 0) return null
        const percentage = ((count / totalBuildings) * 100).toFixed(1)
        return `Risk score ${i}: ${formatBuildingCount(count)} buildings (${percentage}%)`
      })
      .filter(Boolean)
      .join('. ')
    return `Distribution of ${formatBuildingCount(totalBuildings)} buildings across risk scores in ${region}${region.endsWith('.') ? '' : '.'} ${distribution}${score ? `. Selected building has risk score ${score}.` : ''}`
  }, [data, region, score, totalBuildings])

  return (
    <Box sx={sx}>
      <Box
        sx={{ height: '175px', pb: '30px' }}
        role='img'
        aria-label={screenReaderDescription}
      >
        <Chart
          x={[0, 11]}
          y={[0, maxCount * 1.1]}
          padding={{ left: 0, bottom: 0, top: 10 }}
        >
          <Grid horizontal />
          {data.map((count, i) => (
            <Label
              key={i}
              x={i + 0.5}
              y={count}
              verticalAlign='bottom'
              align='center'
              width={0.75}
              sx={{ color: getColorForBar(count, i, score) }}
            >
              {formatBuildingCount(count)}
            </Label>
          ))}
          <Plot>
            <Bar
              width={0.75}
              data={data.map((count, i) => [
                i + 0.5,
                count === 0
                  ? 0
                  : // Bump rendered size to ensure bar visibility
                    Math.max(count, maxCount / 200),
              ])}
              color={data.map((count, i) => getColorForBar(count, i, score))}
            />
          </Plot>
        </Chart>
        <ScoreBar labels sx={{ mt: '8px' }} />
      </Box>
    </Box>
  )
}

export default Histogram
