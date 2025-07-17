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

const Histogram = ({
  address,
  region,
}: {
  address: string
  region: string
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
        <Chart x={[-0.25, 10.25]} y={[0, 10]} padding={{ left: 20 }}>
          <Ticks left />
          <Ticks bottom values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} />
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
              data={[
                [0.5, 7.5],
                [1.5, 7.5],
                [2.5, 7.5],
                [3.5, 7.5],
                [4.5, 7.5],
                [5.5, 7.5],
                [6.5, 7.5],
                [7.5, 7.5],
                [8.5, 7.5],
                [9.5, 7.5],
              ]}
            />
          </Plot>
        </Chart>
      </Box>
    </Box>
  )
}

export default Histogram
