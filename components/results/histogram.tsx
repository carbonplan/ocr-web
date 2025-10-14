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

export const formatValue = (value: number) => {
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
  } else {
    // e.g., 2.7M
    return format('0.2s')(value)
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
  const maxCount: number = useMemo(() => Math.max(...data), [data])

  return (
    <Box sx={sx}>
      <Box
        sx={{
          fontFamily: 'mono',
          letterSpacing: 'mono',
          textTransform: 'uppercase',
          fontSize: [0, 0, 0, 1],
        }}
      >
        Risk scores in {region}
      </Box>
      <Box sx={{ height: '175px', pb: '30px' }}>
        <Chart
          x={[0, 11]}
          y={[1, maxCount * 1.1]}
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
              sx={{ color: String(i) === score ? 'primary' : 'secondary' }}
            >
              {formatValue(count)}
            </Label>
          ))}
          <Plot>
            <Bar
              width={0.75}
              data={data.map((count, i) => [i + 0.5, count])}
              color={data.map((count, i) =>
                String(i) === score ? 'primary' : 'secondary',
              )}
            />
          </Plot>
        </Chart>
        <ScoreBar sx={{ mt: '8px' }} />
      </Box>
    </Box>
  )
}

export default Histogram
