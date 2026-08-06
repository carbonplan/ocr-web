import { Box, Flex, Spinner } from 'theme-ui'
import { format } from 'd3-format'
import { useStore } from '@/lib/store'
import TooltipWrapper from '../tooltip'
import ValueBadge from './value-badge'
import DamageCurve from './damage-curve'

const formatYears = (years: number) =>
  years < 10 ? format('.1~f')(years) : format(',.0f')(Math.round(years))

const monoLabelSx = {
  fontSize: 1,
  fontFamily: 'mono',
  letterSpacing: 'mono',
  textTransform: 'uppercase',
  color: 'secondary',
} as const

// rows always render; a null value (nothing selected, or winds never reach
// the threshold in the event set) shows the empty placeholder badge
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
        <Box sx={monoLabelSx}>Storm winds</Box>
        <Box sx={monoLabelSx}>Once every</Box>
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
          <Box sx={{ fontSize: [1, 1, 1, 2] }}>{label}</Box>
          <ValueBadge
            value={years === null ? null : `${formatYears(years)} yrs`}
            unit='yrs'
          />
        </Flex>
      ))}
    </Box>
  )
}

const WindDetail = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)

  const periodLabel = riskConfig.timePeriodLabels
    ? timePeriod === 'current'
      ? riskConfig.timePeriodLabels.current
      : riskConfig.timePeriodLabels.future[futureWindow]
    : null

  const detail =
    buildingQuery.status === 'success' ? buildingQuery.detail : undefined
  const envelope =
    detail && detail.eadLower !== null && detail.eadUpper !== null
      ? ([
          detail.eadLower * riskConfig.unitScale,
          detail.eadUpper * riskConfig.unitScale,
        ] as [number, number])
      : null

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
          <Box
            sx={{
              fontSize: 1,
              fontFamily: 'mono',
              letterSpacing: 'mono',
              textTransform: 'uppercase',
              color: 'secondary',
            }}
          >
            Annual loss
          </Box>
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
      <Box sx={{ mt: 3, color: 'secondary', fontSize: [0, 0, 0, 1] }}>
        Values describe ~9 km grid cells, so nearby buildings share them.
      </Box>
      {buildingQuery.status === 'error' && selectedBuilding && (
        <Box sx={{ mt: 2, color: 'secondary', fontSize: [1, 1, 1, 2] }}>
          No wind data is available for this building.
        </Box>
      )}
    </Box>
  )
}

export default WindDetail
