import { useEffect, useMemo, useState } from 'react'
import { Box, Flex } from 'theme-ui'
import {
  Chart,
  Label,
  Line,
  Plot,
  Scatter,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import {
  Colors,
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

// Radii in chart units. Spokes run from the center to SPOKE; the dashed ring
// at ZERO is no contribution, and SCALE (display %) reaches the spoke's tip
// or the center.
const ZERO = 0.5
const SPOKE = 1
const SCALE = 30
// a little past the spokes, so the circles at their tips aren't clipped
const DOMAIN = [-1.1, 1.1]

// clockwise from the top, in the order of the Collins paper's radar charts
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

// angle of the driver at store index i
const angle = (i: number) =>
  (ORDER.indexOf(FDP_DRIVERS[i].short) / FDP_DRIVERS.length) * 2 * Math.PI
const polar = (r: number, theta: number): [number, number] => [
  r * Math.sin(theta),
  r * Math.cos(theta),
]
const toRadius = (value: number) =>
  ZERO + Math.max(-1, Math.min(1, value / SCALE)) * (SPOKE - ZERO)

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

const RING = Array.from({ length: 73 }, (_, i) =>
  polar(ZERO, (i / 72) * 2 * Math.PI),
)

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

// The hovered or mapped driver's signed value, at the hub where only spokes
// cross; circles only reach the hub on large drops
const HubValue = ({ value }: { value: number }) => {
  const { bound, text } = formatValue(value)
  return (
    <Label
      x={0}
      y={0}
      align='center'
      verticalAlign='middle'
      width={1}
      height={0.3}
      aria-hidden
      sx={{ color: toColor(value), fontSize: [1, 1, 1, 2] }}
    >
      <Box
        as='span'
        sx={{
          position: 'relative',
          bg: 'background',
          px: 1,
          whiteSpace: 'nowrap',
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
    </Label>
  )
}

const Drivers = () => {
  const driver = useStore((state) => state.selectorValues.driver)
  const setSelectorValues = useStore((state) => state.setSelectorValues)
  const query = useDriverContributions()
  const values = query.status === 'success' ? query.values : null
  const [hovered, setHovered] = useState<number | null>(null)
  const hubValue = values?.[hovered ?? driver] ?? null

  const lollipops = useMemo(
    () =>
      FDP_DRIVERS.flatMap((d, i) => {
        const value = values?.[i]
        if (value == null) return []
        const theta = angle(i)
        const color = toColor(value)
        return [
          {
            key: d.short,
            color,
            stem: [polar(ZERO, theta), polar(toRadius(value), theta)],
            dot: polar(toRadius(value), theta),
          },
        ]
      }),
    [values],
  )

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

  return (
    <Box>
      How much each predictor <Colors.Blue>raises</Colors.Blue> or{' '}
      <Colors.Orange>lowers</Colors.Orange> the probability, along the model’s
      decision paths. Click on a driver to map it.
      <Flex
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 3,
          mt: 3,
        }}
      >
        <Box
          aria-hidden
          sx={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            fontSize: [1, 1, 1, 2],
          }}
        >
          {FDP_DRIVERS[hovered ?? driver]?.label}
        </Box>
        <Box
          role='group'
          aria-label={description}
          sx={{
            width: '55%',
            maxWidth: 220,
            aspectRatio: '1 / 1',
            flexShrink: 0,
            '& div': { pointerEvents: 'none' },
          }}
        >
          <Chart x={DOMAIN} y={DOMAIN} padding={{ left: 0, bottom: 0 }}>
            <Plot>
              {FDP_DRIVERS.map((d, i) => (
                <Line
                  key={d.short}
                  data={[[0, 0], polar(SPOKE, angle(i))]}
                  color={i === driver || i === hovered ? 'primary' : 'muted'}
                />
              ))}
              <Line
                data={RING}
                color='secondary'
                sx={{ strokeDasharray: '3 3' }}
              />
              {lollipops.map(({ key, color, stem, dot }) => (
                <g key={key}>
                  <Line data={stem} color={color} width={2.5} />
                  <Scatter data={[dot]} color={color} size={8} />
                </g>
              ))}
              {/* wide transparent strokes along each spoke as hover targets,
                  and the buttons that map each driver */}
              {FDP_DRIVERS.map((d, i) => (
                <Line
                  key={d.short}
                  data={[[0, 0], polar(SPOKE, angle(i))]}
                  color='transparent'
                  width={16}
                  role='button'
                  tabIndex={0}
                  aria-pressed={i === driver}
                  aria-label={`Map ${d.label}`}
                  onClick={() => setSelectorValues({ driver: i })}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectorValues({ driver: i })
                    }
                  }}
                  sx={{
                    pointerEvents: 'stroke',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                />
              ))}
            </Plot>
            {hubValue !== null && <HubValue value={hubValue} />}
          </Chart>
        </Box>
      </Flex>
      {query.status === 'error' && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No driver data is available for this location.
        </Box>
      )}
    </Box>
  )
}

export default Drivers
