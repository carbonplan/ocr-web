import { Box, Flex, Spinner } from 'theme-ui'
import { format } from 'd3-format'
import { useShallow } from 'zustand/shallow'
import { useStore } from '@/lib/store'
import { getMapLayer, HazardMapLayer } from '@/lib/hazards'
import { useColormap } from '@/lib/colormaps'
import TooltipWrapper from '../tooltip'
import ValueBadge from './value-badge'
import DamageCurve from './damage-curve'
import WindCurve from './wind-curve'

const formatYears = (years: number) =>
  years < 10 ? format('.1~f')(years) : format(',.0f')(Math.round(years))

// a null value means the threshold is never reached in the event set
const RecurrenceTable = ({
  rp33,
  rp50,
}: {
  rp33: number | null
  rp50: number | null
}) => {
  const rows = [
    { label: 'Hurricane force (74+ mph)', years: rp33 },
    { label: 'Major hurricane (112+ mph)', years: rp50 },
  ]

  return (
    <Box sx={{ mt: 3 }}>
      <Flex sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Box variant='label'>Storm winds</Box>
        <Box variant='label'>Once every</Box>
      </Flex>
      {rows.map(({ label, years }) => (
        <Flex
          key={label}
          sx={{
            justifyContent: 'space-between',
            alignItems: 'baseline',
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'muted',
          }}
        >
          <Box>{label}</Box>
          <ValueBadge
            value={years === null ? null : `${formatYears(years)} yrs`}
            unit='yrs'
          />
        </Flex>
      ))}
    </Box>
  )
}

const WindSpeedTable = ({
  layer,
  returnPeriods,
  windSpeed,
  windSpeedLower,
  windSpeedUpper,
  selectedRp,
}: {
  layer: HazardMapLayer
  returnPeriods: number[]
  windSpeed: (number | null)[]
  windSpeedLower: (number | null)[] | null
  windSpeedUpper: (number | null)[] | null
  selectedRp: number | null
}) => {
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))
  const colormap = useColormap()

  const binColor = (value: number) => {
    if (value === 0) return colormap[0]
    for (let i = 0; i < bins.length - 1; i++) {
      if (value < bins[i + 1]) return colormap[i + 1]
    }
    return colormap[bins.length]
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Flex sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Box variant='label'>Storm rarity</Box>
        <Box variant='label'>Peak winds</Box>
      </Flex>
      {returnPeriods.map((rp, i) => {
        const value =
          windSpeed[i] == null ? null : windSpeed[i]! * layer.unitScale
        const lower = windSpeedLower?.[i]
        const upper = windSpeedUpper?.[i]
        const range =
          lower == null || upper == null
            ? null
            : ([lower * layer.unitScale, upper * layer.unitScale] as [
                number,
                number,
              ])
        const selected = rp === selectedRp
        return (
          <Flex
            key={rp}
            sx={{
              justifyContent: 'space-between',
              alignItems: 'baseline',
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'muted',
            }}
          >
            <Box
              sx={{
                fontSize: [1, 1, 1, 2],
                color: selected ? 'primary' : 'secondary',
                transition: 'color 0.2s',
              }}
            >
              1-in-{format(',')(rp)} year storm
            </Box>
            <Flex sx={{ gap: 2, alignItems: 'baseline' }}>
              {range && (
                <Box sx={{ color: 'secondary', fontSize: [1, 1, 1, 2] }}>
                  {Math.round(range[0])}&ndash;{Math.round(range[1])}
                </Box>
              )}
              <ValueBadge
                value={value === null ? null : `${Math.round(value)} mph`}
                unit={layer.unit}
                color={value === null ? undefined : binColor(value)}
              />
            </Flex>
          </Flex>
        )
      })}
      {windSpeedLower && windSpeedUpper && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          The shaded band and ranges span the CHAZ simulations driven by six
          CMIP6 climate models; the line and main values are their median.
        </Box>
      )}
    </Box>
  )
}

const WindDetail = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const mapLayer = useStore((state) => state.mapLayer)
  const selectorValue = useStore((state) => state.mapLayerSelectorValue)

  const activeLayer = getMapLayer(riskConfig, mapLayer)

  let periodLabel
  if (riskConfig.timePeriodLabels) {
    periodLabel =
      timePeriod === 'current'
        ? riskConfig.timePeriodLabels.current
        : riskConfig.timePeriodLabels.future[futureWindow]
  }

  const detail =
    buildingQuery.status === 'success' ? buildingQuery.detail : undefined
  const envelope =
    detail && detail.eadLower !== null && detail.eadUpper !== null
      ? ([
          detail.eadLower * riskConfig.unitScale,
          detail.eadUpper * riskConfig.unitScale,
        ] as [number, number])
      : null

  if (activeLayer) {
    return (
      <Box>
        <WindCurve
          returnPeriods={detail?.returnPeriods}
          windSpeed={detail?.windSpeed}
          windSpeedLower={detail?.windSpeedLower}
          windSpeedUpper={detail?.windSpeedUpper}
          unitScale={activeLayer.unitScale}
          color={riskConfig.accentColor}
        />
        <WindSpeedTable
          layer={activeLayer}
          returnPeriods={
            detail?.returnPeriods ?? activeLayer.selector?.values ?? []
          }
          windSpeed={detail?.windSpeed ?? []}
          windSpeedLower={detail?.windSpeedLower ?? null}
          windSpeedUpper={detail?.windSpeedUpper ?? null}
          selectedRp={selectorValue}
        />
        <RecurrenceTable
          rp33={detail?.rpExceed33 ?? null}
          rp50={detail?.rpExceed50 ?? null}
        />
        <Box variant='description' sx={{ mt: 3, color: 'secondary' }}>
          Values describe ~9 km grid cells, so nearby buildings share them.
        </Box>
        {buildingQuery.status === 'error' &&
          (selectedBuilding || selectedArea) && (
            <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
              No wind data is available for this location.
            </Box>
          )}
      </Box>
    )
  }

  return (
    <Box>
      <Box as='h2' variant='sectionHeading'>
        Expected annual loss
      </Box>
      <Box sx={{ mt: 2 }}>
        The risk score is a categorical classification of expected annual loss:
        the average share of a building&apos;s value expected to be lost each
        year to tropical cyclone damage
        {periodLabel ? ` (${periodLabel})` : ''}.
      </Box>
      <TooltipWrapper
        sx={{ mt: 3, justifyContent: 'flex-start', gap: 3 }}
        tooltip='The range covers the middle 50% of damage-model fits to historical hurricane losses, the dominant uncertainty in absolute tropical cyclone risk.'
      >
        <Flex sx={{ gap: 3, alignItems: 'baseline' }}>
          <Box variant='label'>Annual loss</Box>
          {buildingQuery.status === 'loading' ? (
            <Spinner size={16} />
          ) : (
            <ValueBadge
              value={
                buildingQuery.status === 'success' ? buildingQuery.value : null
              }
              unit='%'
            />
          )}
          {envelope && (
            <Box sx={{ color: 'secondary', fontSize: [1, 1, 1, 2] }}>
              ({format('.2~f')(envelope[0])}&ndash;
              {format('.2~f')(envelope[1])}%)
            </Box>
          )}
        </Flex>
      </TooltipWrapper>
      <RecurrenceTable
        rp33={detail?.rpExceed33 ?? null}
        rp50={detail?.rpExceed50 ?? null}
      />
      <Box as='h2' variant='sectionHeading' sx={{ mt: 4 }}>
        Loss by storm severity
      </Box>
      <Box sx={{ mt: 2, mb: 3 }}>
        Expected loss from single events of increasing rarity, from a 1-in-10
        year storm to a 1-in-1,000 year storm.
      </Box>
      <DamageCurve
        returnPeriods={detail?.returnPeriods}
        damageFraction={detail?.damageFraction}
        windSpeed={detail?.windSpeed}
        unitScale={riskConfig.unitScale}
        color={riskConfig.accentColor}
      />
      <Box variant='description' sx={{ mt: 3, color: 'secondary' }}>
        Values describe ~9 km grid cells, so nearby buildings share them.
      </Box>
      {buildingQuery.status === 'error' &&
        (selectedBuilding || selectedArea) && (
          <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
            No wind data is available for this location.
          </Box>
        )}
    </Box>
  )
}

export default WindDetail
