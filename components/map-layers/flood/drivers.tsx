import { useEffect, useMemo, useState } from 'react'
import { Box, Flex, useThemeUI } from 'theme-ui'
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
  Filter,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { centerOfMass } from '@turf/turf'
import { useStore } from '@/lib/store'
import { FDP_DRIVERS } from '@/lib/hazards/flood'
import {
  getMapLayer,
  resolveHazardDataset,
  toDisplayUnits,
} from '@/lib/hazards'
import { getZarrLayerId, queryRasterPoint } from '@/lib/raster-query'

const LAYER_ID = 'contribution'

// fixed so bar lengths compare across locations, in display %; longer bars
// are clipped at the edge
const SCALE = 15
const CHART_HEIGHT = 130

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

type DriverQuery =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'success'; values: (number | null)[] }

const useDriverContributions = (): DriverQuery => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const zarrLayer = useStore((state) => state.zarrLayer)
  const [query, setQuery] = useState<DriverQuery>({ status: 'idle' })

  useEffect(() => {
    const layer = getMapLayer(riskConfig, LAYER_ID)
    if (!layer?.variable || !layer.selector) return
    if (!selectedBuilding && !selectedArea) {
      setQuery({ status: 'idle' })
      return
    }

    const dataset = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })
    setQuery({ status: 'loading' })
    // the store's layer may still be another variable's; the effect re-runs
    // once the contribution layer is in place
    if (zarrLayer?.id !== getZarrLayerId(dataset.source, layer.variable)) {
      return
    }

    const point = selectedArea
      ? ([selectedArea.lng, selectedArea.lat] as [number, number])
      : (centerOfMass(selectedBuilding!).geometry.coordinates as [
          number,
          number,
        ])
    const range = layer.validRange
    const controller = new AbortController()

    queryRasterPoint(
      zarrLayer,
      layer.variable,
      point,
      controller.signal,
      layer.selector,
    )
      .then((raw) => {
        if (controller.signal.aborted) return
        const values = raw.map((value) =>
          value === null || (range && (value < range[0] || value > range[1]))
            ? null
            : toDisplayUnits(riskConfig, LAYER_ID, value),
        )
        setQuery(
          values.every((v) => v === null)
            ? { status: 'error' }
            : { status: 'success', values },
        )
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.error('Driver query failed:', error)
        setQuery({ status: 'error' })
      })

    return () => controller.abort()
  }, [
    selectedBuilding,
    selectedArea,
    riskConfig,
    timePeriod,
    futureWindow,
    zarrLayer,
  ])

  return query
}

// A driver's signed value, with ValueBadge's bound for low values
const FormattedValue = ({ value }: { value: number }) => {
  const { bound, text } = formatValue(value)
  return (
    <Box
      as='span'
      // matches the chart's tick labels
      sx={{
        position: 'relative',
        color: toColor(value),
        whiteSpace: 'nowrap',
        fontSize: [0, 0, 0, 1],
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

const Drivers = () => {
  const driver = useStore((state) => state.selectorValues.driver)
  const setSelectorValues = useStore((state) => state.setSelectorValues)
  const query = useDriverContributions()
  const values = query.status === 'success' ? query.values : null
  const [hovered, setHovered] = useState<number | null>(null)
  const [sort, setSort] = useState<'value' | 'alphabetical'>('value')
  const { theme } = useThemeUI()
  const shown = hovered ?? driver
  const shownValue = values?.[shown] ?? null

  const columns = useMemo(() => {
    const indices = ORDER.map((short) =>
      FDP_DRIVERS.findIndex((d) => d.short === short),
    )
    if (sort === 'alphabetical') {
      return indices.sort((a, b) =>
        FDP_DRIVERS[a].label.localeCompare(FDP_DRIVERS[b].label),
      )
    }
    if (!values) return indices
    return indices.sort(
      (a, b) => (values[b] ?? -Infinity) - (values[a] ?? -Infinity),
    )
  }, [values, sort])

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

  const select = (i: number) => setSelectorValues({ driver: i })
  const band = (k: number) => ({
    x: [k - 0.4, k + 0.4],
    y: [-SCALE, SCALE],
  })

  return (
    <Box>
      How much each predictor <Colors.Blue>raises</Colors.Blue> or{' '}
      <Colors.Orange>lowers</Colors.Orange> the probability, along the model’s
      decision paths. Click on a driver to map it.
      <Box sx={{ mt: 3 }}>
        <Filter
          role='group'
          aria-label='Sort drivers'
          values={{
            value: sort === 'value',
            alphabetical: sort === 'alphabetical',
          }}
          labels={{ value: 'By value', alphabetical: 'A-Z' }}
          setValues={(next: Record<string, boolean>) => {
            if (next.alphabetical) setSort('alphabetical')
            else if (next.value) setSort('value')
          }}
        />
      </Box>
      <Flex
        aria-hidden
        sx={{
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 2,
          mt: 3,
          mb: 2,
          fontFamily: 'mono',
          letterSpacing: 'mono',
          textTransform: 'uppercase',
          fontSize: [1, 1, 1, 2],
        }}
      >
        <Box sx={{ color: 'primary' }}>{FDP_DRIVERS[shown]?.label}</Box>
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
            values={[-SCALE, SCALE]}
            format={(d: number) => `${d > 0 ? '+' : ''}${d}%`}
            sx={{ ml: -2 }}
          />
          <Plot>
            <Bar
              data={columns.map((i, k) => [k, values?.[i] ?? 0])}
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
      {query.status === 'error' && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No driver data is available for this location.
        </Box>
      )}
    </Box>
  )
}

export default Drivers
