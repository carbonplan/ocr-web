import {
  Bar,
  Chart,
  Grid,
  Plot,
  Ticks,
  TickLabels,
  Axis,
  AxisLabel,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import { Box } from 'theme-ui'

const NUM_BINS = 10

const Histogram = ({
  address,
  region,
  score,
}: {
  address: string
  region: string
  score: number
}) => {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Box as='span' sx={{ color: 'red' }}>
          {address}
        </Box>{' '}
        compared to {region}
      </Box>
      <Box sx={{ height: '250px', ml: -20 }}>
        <Chart
          x={[-0.25, NUM_BINS + 0.25]}
          y={[0, NUM_BINS]}
          padding={{ left: 20 }}
        >
          <Ticks left />
          <Ticks
            bottom
            values={Array(NUM_BINS + 1)
              .fill(null)
              .map((d, i) => i)}
          />
          <TickLabels bottom format={(d: number) => `${d * 10}%`} />
          <Grid horizontal />
          <Axis left bottom />
          <AxisLabel bottom units='%'>
            Burn probability
          </AxisLabel>
          <AxisLabel left units=''>
            Number addresses
          </AxisLabel>
          <Plot>
            <Bar
              width={0.75}
              data={Array(NUM_BINS)
                .fill(null)
                .map((d, i) => [i + 0.5, 7.5])}
              color={Array(NUM_BINS)
                .fill(null)
                .map((d, i) =>
                  score >= i * 10 && score < (i + 1) * 10 ? 'red' : 'primary',
                )}
            />
          </Plot>
        </Chart>
      </Box>
    </Box>
  )
}

export default Histogram
