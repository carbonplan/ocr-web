import { useMemo } from 'react'
import {
  AxisLabel,
  Chart,
  Grid,
  Line,
  Plot,
  Scatter,
  TickLabels,
  Ticks,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import { Box, ThemeUIStyleObject } from 'theme-ui'
import { format } from 'd3-format'

const DEFAULT_RETURN_PERIODS = [10, 25, 50, 100, 250, 1000]
const PLACEHOLDER_Y_MAX = 20

const DamageCurve = ({
  returnPeriods = DEFAULT_RETURN_PERIODS,
  damageFraction = [],
  windSpeed = [],
  unitScale,
  color = 'teal',
  sx,
}: {
  returnPeriods?: number[]
  damageFraction?: (number | null)[]
  windSpeed?: (number | null)[]
  unitScale: number
  color?: string
  sx?: ThemeUIStyleObject
}) => {
  const points = useMemo(
    () =>
      returnPeriods.flatMap((rp, i) => {
        const damage = damageFraction[i]
        return damage == null
          ? []
          : [[rp, damage * unitScale] as [number, number]]
      }),
    [returnPeriods, damageFraction, unitScale],
  )
  const hasData = points.length >= 2

  const yMax = useMemo(
    () =>
      hasData
        ? Math.max(...points.map(([, y]) => y), 0.1) * 1.15
        : PLACEHOLDER_Y_MAX,
    [hasData, points],
  )

  const description = useMemo(() => {
    if (!hasData)
      return 'Expected loss by storm severity. No building selected.'
    const steps = returnPeriods
      .map((rp, i) => {
        const damage = damageFraction[i]
        if (damage == null) return null
        const wind = windSpeed[i]
        const windText =
          wind == null ? '' : ` (${Math.round(wind * 2.23694)} mph winds)`
        return `1-in-${rp} year event${windText}: ${format('.2~f')(damage * unitScale)}% loss`
      })
      .filter(Boolean)
      .join('. ')
    return `Expected loss by storm severity. ${steps}.`
  }, [hasData, returnPeriods, damageFraction, windSpeed, unitScale])

  return (
    <Box sx={sx}>
      <Box sx={{ height: '200px' }} role='img' aria-label={description}>
        <Chart
          logx
          x={[9.5, 1080]}
          y={[0, yMax]}
          padding={{ left: 56, right: 0, bottom: 50, top: 10 }}
        >
          <Grid horizontal />
          {/* no values: the log scale emits minor ticks between decades */}
          <Ticks bottom sx={{ borderColor: 'muted' }} />
          <Ticks
            bottom
            values={returnPeriods}
            sx={{ borderColor: 'secondary' }}
          />
          <TickLabels bottom values={returnPeriods} format={format('~s')} />
          <TickLabels left count={3} format={format('.2~f')} />
          <AxisLabel bottom units='years (log)'>
            Return period
          </AxisLabel>
          <AxisLabel left units='%'>
            Loss
          </AxisLabel>
          <Plot>
            {hasData && <Line data={points} width={1.5} color={color} />}
            {hasData && <Scatter data={points} size={8} color={color} />}
          </Plot>
        </Chart>
      </Box>
    </Box>
  )
}

export default DamageCurve
