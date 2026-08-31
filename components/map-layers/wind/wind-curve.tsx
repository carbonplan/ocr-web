import { useMemo } from 'react'
import {
  Area,
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
// tall enough that the placeholder shows the full category scale
const PLACEHOLDER_Y_MAX = 175
// Saffir-Simpson category floors (1-min sustained wind, mph)
const CATEGORY_EDGES = [74, 96, 111, 130, 157]
const CATEGORY_LABELS = ['Cat 1', 'Cat 2', 'Cat 3', 'Cat 4', 'Cat 5']

const WindCurve = ({
  returnPeriod,
  returnPeriods = DEFAULT_RETURN_PERIODS,
  windSpeed = [],
  windSpeedLower = null,
  windSpeedUpper = null,
  unitScale,
  color = 'teal',
  sx,
}: {
  returnPeriod: number
  returnPeriods?: number[]
  windSpeed?: (number | null)[]
  windSpeedLower?: (number | null)[] | null
  windSpeedUpper?: (number | null)[] | null
  unitScale: number
  color?: string
  sx?: ThemeUIStyleObject
}) => {
  const points = useMemo(
    () =>
      returnPeriods.flatMap((rp, i) => {
        const wind = windSpeed[i]
        return wind == null ? [] : [[rp, wind * unitScale] as [number, number]]
      }),
    [returnPeriods, windSpeed, unitScale],
  )
  const band = useMemo(() => {
    if (!windSpeedLower || !windSpeedUpper) return null
    const rows = returnPeriods.flatMap((rp, i) => {
      const lower = windSpeedLower[i]
      const upper = windSpeedUpper[i]
      return lower == null || upper == null
        ? []
        : [
            [rp, lower * unitScale, upper * unitScale] as [
              number,
              number,
              number,
            ],
          ]
    })
    return rows.length >= 2 ? rows : null
  }, [returnPeriods, windSpeedLower, windSpeedUpper, unitScale])
  const hasData = points.length >= 2

  const [yMin, yMax] = useMemo(() => {
    if (!hasData) return [0, PLACEHOLDER_Y_MAX]
    const ys = [
      ...points.map(([, y]) => y),
      ...(band ?? []).flatMap(([, lower, upper]) => [lower, upper]),
    ]
    const top = Math.max(...ys)
    const bottom = Math.min(...ys)
    const min = Math.max(
      0,
      Math.floor((bottom - (top - bottom) * 0.15) / 10) * 10,
    )
    return [min, Math.max(top + (top - min) * 0.1, min + 25)]
  }, [hasData, points, band])

  const categories = CATEGORY_EDGES.map((edge, i) => ({
    edge,
    label: CATEGORY_LABELS[i],
  })).filter(({ edge }) => edge > yMin && edge < yMax)

  const description = useMemo(() => {
    if (!hasData) return 'Peak wind speed by storm rarity. No point selected.'
    const steps = returnPeriods
      .map((rp, i) => {
        const wind = windSpeed[i]
        if (wind == null) return null
        const lower = windSpeedLower?.[i]
        const upper = windSpeedUpper?.[i]
        const rangeText =
          lower == null || upper == null
            ? ''
            : ` (${Math.round(lower * unitScale)}-${Math.round(
                upper * unitScale,
              )} mph across climate models)`
        return `1-in-${rp} year storm: ${Math.round(wind * unitScale)} mph${rangeText}`
      })
      .filter(Boolean)
      .join('. ')
    return `Peak wind speed by storm rarity. ${steps}.`
  }, [
    hasData,
    returnPeriods,
    windSpeed,
    windSpeedLower,
    windSpeedUpper,
    unitScale,
  ])

  return (
    <Box sx={sx}>
      <Box sx={{ height: '200px' }} role='img' aria-label={description}>
        <Chart
          logx
          x={[9.5, 1080]}
          y={[yMin, yMax]}
          padding={{ left: 56, right: 48, bottom: 50, top: 10 }}
        >
          <Grid
            horizontal
            values={categories.map(({ edge }) => edge)}
            sx={{ borderColor: 'muted' }}
          />
          <Grid
            vertical
            values={[returnPeriod]}
            sx={{ borderColor: 'secondary' }}
          />
          {/* no values: the log scale emits minor ticks between decades */}
          <Ticks bottom sx={{ borderColor: 'muted' }} />
          <Ticks
            bottom
            values={returnPeriods}
            sx={{ borderColor: 'secondary' }}
          />
          <TickLabels bottom values={returnPeriods} format={format('~s')} />
          <TickLabels left count={3} format={format('.0f')} />
          <TickLabels
            right
            values={categories.map(({ edge }) => edge)}
            labels={categories.map(({ label }) => label)}
            sx={{ fontSize: [0, 0, 0, 1], whiteSpace: 'nowrap' }}
          />
          <AxisLabel bottom units='years (log)'>
            Return period
          </AxisLabel>
          <AxisLabel left units='mph'>
            Peak winds
          </AxisLabel>
          <Plot>
            {band && <Area data={band} color={color} sx={{ opacity: 0.2 }} />}
            {hasData && <Line data={points} width={1.5} color={color} />}
            {hasData && <Scatter data={points} size={8} color={color} />}
          </Plot>
        </Chart>
      </Box>
    </Box>
  )
}

export default WindCurve
