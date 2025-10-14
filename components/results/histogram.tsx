import { useMemo } from 'react'
import {
  Bar,
  Chart,
  Grid,
  Plot,
  Ticks,
  TickLabels,
  Axis,
  AxisLabel,
  Label,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import { Box, ThemeUIStyleObject } from 'theme-ui'
import { format } from 'd3-format'

export const formatValue = (value: number) => {
  const abs = Math.abs(value)
  if (abs === 0) {
    return '0'
  } else if (abs < 0.0001) {
    return format('.0e')(value)
  } else if (abs < 0.01) {
    return format('.2')(value)
  } else if (abs < 1) {
    return format('.2f')(value)
  } else if (abs < 10) {
    return format('.1f')(value)
  } else if (abs < 10000) {
    return format('.0f')(value)
  } else {
    return format('0.2s')(value)
  }
}

const Histogram = ({
  data,
  region,
  sx,
}: {
  address: string
  region: string
  data: number[]
  sx?: ThemeUIStyleObject
}) => {
  const maxCount: number = useMemo(() => Math.max(...data), [data])

  return (
    <Box sx={sx}>
      <Box sx={{ height: '200px' }}>
        <Chart
          x={[-1, 11]}
          y={[0, maxCount * 1.2]}
          padding={{ left: 60, bottom: 22, top: 10 }}
        >
          <Ticks left />
          <Ticks bottom values={data.map((b, i) => i)} />
          <TickLabels bottom values={data.map((b, i) => i)} />
          <TickLabels left format={formatValue} />
          <Grid horizontal />
          <Axis left bottom />
          <AxisLabel left units='#'>
            Buildings
          </AxisLabel>
          <Label
            x={10.5}
            y={maxCount * 1.2}
            sx={{ color: 'primary' }}
            align='right'
          >
            Risk scores in {region}
          </Label>
          <Plot>
            <Bar
              width={0.75}
              data={data.map((count, i) => [i, count])}
              color='primary'
            />
          </Plot>
        </Chart>
      </Box>
    </Box>
  )
}

export default Histogram
