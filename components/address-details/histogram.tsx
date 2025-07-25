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

const NUM_BINS = 10

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
  data: number[][]
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
        'primary',
      ),
    [score, colormap, colorLimits, riskConfig.binRatios],
  )

  const maxCount: number = useMemo(() => {
    return Math.max(...data.map(([, count]) => count))
  }, [data])

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Box as='span' sx={{ color: scoreColor }}>
          {address}
        </Box>{' '}
        compared to {region}
      </Box>
      <Box sx={{ height: '250px', ml: -20 }}>
        <Chart
          x={[-0.25, NUM_BINS + 0.25]}
          y={[0, maxCount * 1.1]}
          padding={{ left: 60 }}
        >
          <Ticks left />
          <Ticks
            bottom
            values={Array(NUM_BINS + 1)
              .fill(null)
              .map((d, i) => i)}
          />
          <TickLabels bottom format={(d: number) => `${d * 10}%`} />
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
              data={data}
              color={
                data.length > 0
                  ? Array(data.length)
                      .fill(null)
                      .map((d, i) => {
                        const binStart = i * 10
                        const binEnd = (i + 1) * 10
                        const isInBin =
                          i === NUM_BINS - 1
                            ? score >= binStart && score <= binEnd
                            : score >= binStart && score < binEnd

                        return isInBin ? scoreColor : 'primary'
                      })
                  : []
              }
            />
          </Plot>
        </Chart>
      </Box>
    </Box>
  )
}

export default Histogram
