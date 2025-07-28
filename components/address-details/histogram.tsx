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
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import { Box } from 'theme-ui'
import { format } from 'd3-format'
import { useStore } from '@/lib/store'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'

const BINS = [
  0, // true 0%
  10, // 0.01-10
  20, // 10-20
  30, // 20-30
  40, // 30-40
  50, // 40-50
  60, // 50-60
  70, // 60-70
  80, // 70-80
  90, // 80-90
  100, // 90-100
]

export const formatValue = (value: number) => {
  const abs = Math.abs(value)
  if (abs === 0) {
    return 0
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
  address,
  region,
  score,
  data,
}: {
  address: string
  region: string
  score: number
  data: number[]
}) => {
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)

  const colormap = useColormap(riskConfig.colormap, {
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  const scoreColor = useMemo(
    () =>
      getColorForRiskScore(
        score,
        colormap,
        colorLimits,
        riskConfig.binRatios,
        'secondary',
      ),
    [score, colormap, colorLimits, riskConfig.binRatios],
  )

  const maxCount: number = useMemo(() => Math.max(...data), [data])
  const plotData = useMemo(
    () => data.map((count, i) => [i * 10 - 5, count]),
    [data],
  )

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Box as='span' sx={{ color: scoreColor }}>
          {address}
        </Box>{' '}
        compared to {region}
      </Box>
      <Box sx={{ height: '250px', ml: -20 }}>
        <Chart x={[-12, 102]} y={[0, maxCount * 1.1]} padding={{ left: 60 }}>
          <Ticks left />
          <Ticks bottom values={BINS} />
          <TickLabels
            bottom
            values={[-6, ...BINS.filter((b) => b > 0 && b % 20 === 0)]}
            format={(d: number) => (d < 0 ? '0%' : `${d}%`)}
          />
          <TickLabels left format={formatValue} />
          <Grid horizontal />
          <Axis left bottom />
          <AxisLabel bottom units='%'>
            Burn probability
          </AxisLabel>
          <AxisLabel left>Number addresses</AxisLabel>
          <Plot>
            <Bar
              width={0.75}
              data={plotData}
              color={BINS.map((bin, i) => {
                const isInBin =
                  i === 0 ? score < 0.01 : score > BINS[i - 1] && score <= bin

                return isInBin ? scoreColor : 'primary'
              })}
            />
          </Plot>
        </Chart>
      </Box>
    </Box>
  )
}

export default Histogram
