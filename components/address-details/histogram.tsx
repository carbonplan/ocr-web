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

  const countyBins = useMemo(() => {
    if (!activeCounty) return []

    const year = timePeriod === 'current' ? '2011' : '2047'
    const riskType = attribute === 'baseRisk' ? 'risk' : 'wind_risk'
    const countsKey = `${riskType}_${year}_horizon_${timeHorizon}`
    const countsString = activeCounty[countsKey as keyof typeof activeCounty]

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
  }, [activeCounty, attribute, timeHorizon, timePeriod])

  const maxCount: number = useMemo(() => {
    return Math.max(...countyBins.map(([, count]) => count))
  }, [countyBins])

  if (!activeCounty) return null

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

                        return isInBin ? 'red' : 'primary'
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
