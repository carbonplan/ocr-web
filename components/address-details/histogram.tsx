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
import { useStore } from '@/lib/store'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'

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
  const activeCounty = useStore((state) => state.activeCounty)
  const attribute = useStore((state) => state.attribute)
  const timeHorizon = useStore((state) => state.timeHorizon)
  const timePeriod = useStore((state) => state.timePeriod)
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

  const countyBins = useMemo(() => {
    if (!activeCounty) return []

    const riskKey = riskConfig.attributes[attribute][timePeriod]
    const countsKey = `${riskKey}_horizon_${timeHorizon}`
    const countsString = activeCounty[countsKey]

    if (!countsString || typeof countsString !== 'string') {
      return []
    }

    try {
      const counts = JSON.parse(countsString) as number[]
      return counts.slice(0, NUM_BINS).map((count, i) => [i + 0.5, count])
    } catch (error) {
      console.error('Error parsing counts data:', error)
      return []
    }
  }, [activeCounty, attribute, timeHorizon, timePeriod, riskConfig])

  const maxCount: number = useMemo(() => {
    return Math.max(...countyBins.map(([, count]) => count))
  }, [countyBins])

  if (!activeCounty) return null

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
          <TickLabels left />
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
              data={countyBins}
              color={
                countyBins.length > 0
                  ? Array(countyBins.length)
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
