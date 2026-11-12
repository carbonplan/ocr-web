import { useMemo, useState } from 'react'
import { Box, Checkbox, Flex, ThemeUIStyleObject, useThemeUI } from 'theme-ui'
import { alpha } from '@theme-ui/color'
import {
  Bar,
  Chart,
  Grid,
  AxisLabel,
  Label,
  Plot,
  Rect,
  TickLabels,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import {
  Colors,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { FDP_DRIVERS } from '@/lib/hazards/flood'
import { toDisplayUnits } from '@/lib/hazards'
import { FdpPointQuery } from '@/hooks/useFdpPoint'

const LAYER_ID = 'contribution'

const SCALE = 15
const CHART_HEIGHT = 130

// A broken side reads true values up to `at`, then a gap `gap` high, then
// [at, its max] compressed into the rest of the side; in display %
const BREAK = { at: 10, gap: 1 }
const BREAK_END = BREAK.at + BREAK.gap

// a side breaks only past SCALE by more than this, and a bar is cut only past
// the break by more than this, in display %; a bar just past either is clamped
// to it, and its label gives the value
const OVERSHOOT = 0.5

// Each side's max if its axis breaks, else null; the longest bar on a broken
// side reaches its edge
type Axis = { pos: number | null; neg: number | null }

const getAxis = (values: (number | null)[] | null): Axis => {
  const top = (sign: number) => {
    const max = Math.max(0, ...(values ?? []).map((v) => sign * (v ?? 0)))
    return max > SCALE + OVERSHOOT ? max : null
  }
  return { pos: top(1), neg: top(-1) }
}

// Where a value's bar ends on the chart's [-SCALE, SCALE] y-axis, and whether
// it's cut at its side's break
const toBar = (value: number, axis: Axis) => {
  const sign = Math.sign(value)
  const size = Math.abs(value)
  const top = value > 0 ? axis.pos : axis.neg
  if (top === null) return { y: sign * Math.min(size, SCALE), cut: false }
  if (size <= BREAK.at + OVERSHOOT) {
    return { y: sign * Math.min(size, BREAK.at), cut: false }
  }
  const fraction = (size - BREAK.at) / (top - BREAK.at)
  return { y: sign * (BREAK_END + fraction * (SCALE - BREAK_END)), cut: true }
}

// The gap across column k's bar, at its side's axis break
const BarBreak = ({ k, sign }: { k: number; sign: number }) => (
  <Rect
    x={[k - 0.5, k + 0.5]}
    y={[sign * BREAK.at, sign * BREAK_END]}
    color='background'
    style={{ pointerEvents: 'none' }}
  />
)

// column order until there are values to sort by, from the Collins paper's
// radar charts
const ORDER = [
  'DIST',
  'LC',
  'SOIL',
  'CHAN',
  'TWI',
  'CURV',
  'ROAD',
  'HAND',
  'FP',
  'PRCP',
  'ELEV',
]

// the displayed precision, in display %
const THRESHOLD = 0.1

// Like ValueBadge's low values: a nonzero value below the displayed precision
// reads as the threshold, behind a bound (< +0.1%, > -0.1%) rather than as
// 0.0% or -0.0%
const formatValue = (value: number) => {
  if (value !== 0 && Math.abs(value) < THRESHOLD) {
    return value > 0
      ? { bound: '<', text: `+${THRESHOLD.toFixed(1)}%` }
      : { bound: '>', text: `-${THRESHOLD.toFixed(1)}%` }
  }
  return { bound: null, text: `${value > 0 ? '+' : ''}${value.toFixed(1)}%` }
}

const toColor = (value: number) => {
  if (value > 0) return 'blue'
  if (value < 0) return 'orange'
  return 'secondary'
}

// A driver's signed value, with ValueBadge's bound for low values
const FormattedValue = ({
  value,
  sx,
}: {
  value: number
  sx?: ThemeUIStyleObject
}) => {
  const { bound, text } = formatValue(value)
  return (
    <Box
      as='span'
      sx={{
        position: 'relative',
        color: toColor(value),
        whiteSpace: 'nowrap',
        fontSize: [0, 0, 0, 1],
        ...sx,
      }}
    >
      {/* outside the flow, as in ValueBadge, so the value stays centered */}
      {bound && (
        <Box
          as='span'
          sx={{ position: 'absolute', right: '100%', color: 'secondary' }}
        >
          {bound}
        </Box>
      )}
      {text}
    </Box>
  )
}

const Drivers = ({ point }: { point: FdpPointQuery }) => {
  const driver = useStore((state) => state.selectorValues.driver)
  const setSelectorValues = useStore((state) => state.setSelectorValues)
  const riskConfig = useStore((state) => state.riskConfig)
  // in display %; null with no point, or when no driver has a value there
  const values = useMemo(() => {
    if (point.status !== 'success') return null
    const { contribution } = point.data
    if (contribution.every((v) => v === null)) return null
    return contribution.map((v) =>
      v === null ? null : toDisplayUnits(riskConfig, LAYER_ID, v),
    )
  }, [point, riskConfig])
  const [hovered, setHovered] = useState<number | null>(null)
  const [autoSort, setAutoSort] = useState(true)
  const { theme } = useThemeUI()
  const shown = hovered ?? driver
  const shownValue = values?.[shown] ?? null

  const columns = useMemo(() => {
    const indices = ORDER.map((short) =>
      FDP_DRIVERS.findIndex((d) => d.short === short),
    )
    if (!autoSort) {
      return indices.sort((a, b) =>
        FDP_DRIVERS[a].label.localeCompare(FDP_DRIVERS[b].label),
      )
    }
    if (!values) return indices
    return indices.sort(
      (a, b) => (values[b] ?? -Infinity) - (values[a] ?? -Infinity),
    )
  }, [values, autoSort])

  const description = useMemo(() => {
    if (!values) return 'Driver contributions. No point selected.'
    const steps = FDP_DRIVERS.map((d, i) => {
      const value = values[i]
      if (value == null) return null
      const { bound, text } = formatValue(value)
      return `${d.label}: ${bound ?? ''}${text}`
    })
      .filter(Boolean)
      .join('. ')
    return `Change in flood damage probability by driver. ${steps}.`
  }, [values])

  const top = useMemo(() => {
    if (!values) return null
    const i = values.reduce<number | null>(
      (best, v, j) =>
        v !== null &&
        v !== 0 &&
        (best === null || Math.abs(v) > Math.abs(values[best]!))
          ? j
          : best,
      null,
    )
    return i === null ? null : { index: i, value: values[i]! }
  }, [values])

  const axis = useMemo(() => getAxis(values), [values])
  const bars = columns.map((i) => toBar(values?.[i] ?? 0, axis))

  // a broken side labels only the break; its bars' own labels give the rest
  const ticks = [
    axis.neg !== null ? -BREAK.at : -SCALE,
    axis.pos !== null ? BREAK.at : SCALE,
  ]

  const select = (i: number) => setSelectorValues({ driver: i })
  const band = (k: number) => ({
    x: [k - 0.4, k + 0.4],
    y: [-SCALE, SCALE],
  })

  return (
    <Box>
      <Box>
        How much each predictor <Colors.Blue>raises</Colors.Blue> or{' '}
        <Colors.Orange>lowers</Colors.Orange> the probability, along the model’s
        decision paths. Click on a driver to map it.
      </Box>
      {top ? (
        <Box sx={{ mt: 2 }}>
          The top driver at this location is the{' '}
          <Box
            as='button'
            aria-pressed={top.index === driver}
            aria-label={`Map ${FDP_DRIVERS[top.index].label}`}
            onClick={() => select(top.index)}
            onMouseEnter={() => setHovered(top.index)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(top.index)}
            onBlur={() => setHovered(null)}
            sx={{
              p: 0,
              border: 'none',
              bg: 'transparent',
              fontFamily: 'mono',
              letterSpacing: 'mono',
              textTransform: 'uppercase',
              fontSize: [1, 1, 1, 2],
              cursor: driver === top.index ? 'default' : 'pointer',
              transition: 'color 0.2s',
              color: toColor(top.value),
              '&:hover, &:focus-visible': {
                color: 'secondary',
              },
            }}
          >
            {FDP_DRIVERS[top.index].label.toLowerCase()}
          </Box>
          , which changes the probability by{' '}
          <FormattedValue
            value={top.value}
            sx={{
              fontFamily: 'mono',
              letterSpacing: 'mono',
              fontSize: [1, 1, 1, 2],
            }}
          />
          .
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>No driver data is available for this location.</Box>
      )}

      <Flex
        sx={{
          justifyContent: 'space-between',
          alignItems: 'baseline',
          my: 3,
          fontFamily: 'mono',
          letterSpacing: 'mono',
          textTransform: 'uppercase',
          fontSize: [1, 1, 1, 2],
        }}
      >
        <Box sx={{ color: toColor(shownValue ?? 0) }}>
          {FDP_DRIVERS[shown]?.label}
        </Box>

        <Flex
          as='label'
          sx={{
            alignItems: 'center',
            gap: 2,
            width: 'fit-content',
            cursor: 'pointer',
            color: 'primary',
          }}
        >
          Auto-sort
          <Checkbox
            aria-label='Auto-sort'
            checked={autoSort}
            onChange={() => setAutoSort((on) => !on)}
            sx={{ fill: 'primary' }}
          />
        </Flex>
      </Flex>
      <Box
        role='group'
        aria-label={description}
        sx={{
          height: CHART_HEIGHT,
          '& div': { pointerEvents: 'none' },
        }}
      >
        <Chart
          x={[-0.5, columns.length - 0.5]}
          y={[-SCALE, SCALE]}
          padding={{ left: 20, right: 32, bottom: 16 }}
        >
          <Grid horizontal values={[0]} sx={{ borderColor: 'secondary' }} />
          <AxisLabel left units='%' arrow={false}>
            Contribution
          </AxisLabel>
          <TickLabels
            right
            values={ticks}
            format={(d: number) => `${d > 0 ? '+' : ''}${d}%`}
            sx={{ ml: -2 }}
          />
          <Plot>
            <Bar
              data={bars.map((bar, k) => [k, bar.y])}
              color={columns.map((i) => toColor(values?.[i] ?? 0))}
            />
            {columns.map((i, k) => (
              <Rect
                key={i}
                {...band(k)}
                color={alpha(
                  toColor(values?.[i] ?? 0),
                  i === driver || i === hovered ? 0.25 : 0.1,
                )(theme)}
                role='button'
                tabIndex={0}
                aria-pressed={i === driver}
                aria-label={`Map ${FDP_DRIVERS[i].label}`}
                onClick={() => select(i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    select(i)
                  }
                }}
                style={{
                  cursor: 'pointer',
                  outline: 'none',
                  pointerEvents: 'all',
                }}
              />
            ))}
            {bars.map(
              (bar, k) =>
                bar.cut && (
                  <BarBreak key={`break-${k}`} k={k} sign={Math.sign(bar.y)} />
                ),
            )}
          </Plot>
          {shownValue !== null && (
            <Label
              x={columns.indexOf(shown)}
              y={-SCALE}
              verticalAlign='top'
              aria-hidden
              sx={{ pt: 1 }}
            >
              <Box
                as='span'
                sx={{ display: 'inline-block', transform: 'translateX(-50%)' }}
              >
                <FormattedValue value={shownValue} />
              </Box>
            </Label>
          )}
        </Chart>
      </Box>
    </Box>
  )
}

export default Drivers
