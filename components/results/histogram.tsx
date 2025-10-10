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
import { Box, ThemeUIStyleObject } from 'theme-ui'
import { format } from 'd3-format'

const BINS = [
  0, // true 0%
  5, // 0.01-5
  10, // 5-10
  15, // 10-15
  20, // 15-20
  25, // 20-2%
  100, // 25+
]

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
  sx,
}: {
  address: string
  region: string
  data: number[]
  sx?: ThemeUIStyleObject
}) => {
  const maxCount: number = useMemo(() => Math.max(...data), [data])

  const { plotData, xRange, tickValues, tickLabelValues } = useMemo(() => {
    const binWidth = BINS[2] - BINS[1]
    const halfBinWidth = binWidth / 2

    const positions = BINS.map((bin, i) => {
      if (i === 0) {
        return -halfBinWidth
      } else if (i === BINS.length - 1) {
        return BINS[i - 1] + halfBinWidth
      } else {
        const prevBin = BINS[i - 1]
        const currentBin = BINS[i]
        return (prevBin + currentBin) / 2
      }
    })

    const minPosition = Math.min(...positions)
    const maxPosition = Math.max(...positions)
    const padding = halfBinWidth

    const ticks = BINS.slice(0, -1)

    const tickLabels = [positions[0], ...BINS.slice(1, -1)]

    return {
      plotData: data.map((count, i) => [positions[i], count]),
      xRange: [minPosition - padding, maxPosition + padding] as [
        number,
        number,
      ],
      tickValues: ticks,
      tickLabelValues: tickLabels,
    }
  }, [data])

  return (
    <Box sx={sx}>
      <Box sx={{ height: '250px' }}>
        <Chart x={xRange} y={[0, maxCount * 1.1]} padding={{ left: 60 }}>
          <Ticks left />
          <Ticks bottom values={tickValues} />
          <TickLabels
            bottom
            values={tickLabelValues}
            format={(d: number) => {
              if (d === tickLabelValues[0]) return '0%'
              if (d === BINS[BINS.length - 2])
                return `${BINS[BINS.length - 2]}%+`
              return `${d}%`
            }}
          />
          <TickLabels left format={formatValue} />
          <Grid horizontal />
          <Axis left bottom />
          <AxisLabel bottom units='%'>
            Risk of structure loss
          </AxisLabel>
          <AxisLabel left>Number buildings</AxisLabel>
          <Plot>
            <Bar width={0.75} data={plotData} color='primary' />
          </Plot>
        </Chart>
      </Box>
    </Box>
  )
}

export default Histogram
