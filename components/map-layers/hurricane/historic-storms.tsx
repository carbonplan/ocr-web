import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import { TROPICAL_STORM_MPH, formatStormName } from '@/lib/historic-events'
import ValueBadge from '../../value-badge'
import EyeCheckbox from '../../eye-checkbox'
import TooltipWrapper from '../../tooltip'
import { tableSx } from '../../tooltip-table'

const FIRST_SEASON = 2004

const REACHED_NOTE =
  'The date and time (UTC) of the first 3-hourly best-track position from which the storm\u2019s tropical-storm-force winds reached this location: the location lies within the storm\u2019s 34 kt wind radius, the largest of its four quadrant radii. Storms start in 2004, when best tracks began recording wind radii routinely.'

const formatReached = (time: string) =>
  new Date(`${time.replace(' ', 'T')}Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

// Storms at the selected point, most recent first
export const useHistoricStorms = () => {
  const historicEvents = useStore((state) => state.historicEvents)
  const storms =
    historicEvents.status === 'success' && historicEvents.kind === 'storms'
      ? historicEvents.events
      : null
  return { status: historicEvents.status, storms }
}

const Row = ({
  label,
  value,
  hovered = false,
  onHover,
  eye,
}: {
  label: React.ReactNode
  value: string | number | null
  hovered?: boolean
  onHover?: () => void
  eye?: { checked: boolean; toggle: () => void; label: string }
}) => (
  <Flex
    sx={{
      ...tableSx.row,
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 2,
      py: 2,
      ...(onHover
        ? {
            cursor: 'pointer',
            mx: -2,
            px: 2,
            bg: hovered ? 'muted' : 'transparent',
            color: hovered ? 'primary' : 'inherit',
            transition: 'background-color 0.15s, color 0.15s',
          }
        : {}),
    }}
    onMouseEnter={onHover}
  >
    <Box>{label}</Box>
    <Flex sx={{ gap: 2, flexShrink: 0 }}>
      <ValueBadge value={value} unit='#' toFixed={0} />
      {eye && (
        <Box as='label' sx={{ display: 'flex', cursor: 'pointer' }}>
          <EyeCheckbox
            checked={eye.checked}
            onChange={eye.toggle}
            aria-label={eye.label}
          />
        </Box>
      )}
    </Flex>
  </Flex>
)

const HistoricStorms = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const hoveredEventId = useStore((state) => state.hoveredEventId)
  const selectedStormId = useStore((state) => state.selectedStormId)
  const setSelectedStormId = useStore((state) => state.setSelectedStormId)
  const { status, storms } = useHistoricStorms()
  const hasSelection = Boolean(selectedBuilding || selectedArea)

  return (
    <Box>
      Tropical cyclones since {FIRST_SEASON} whose tropical-storm-force winds (
      {TROPICAL_STORM_MPH}+ mph) reached this location by NOAA&apos;s best
      track, and when they first did.
      {!hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          Select a location to see its storm history.
        </Box>
      )}
      {status === 'error' && hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No storm data is available for this location.
        </Box>
      )}
      {storms && (
        <Box sx={{ mt: 3 }}>
          <Flex
            sx={{
              ...tableSx.row,
              justifyContent: 'space-between',
              alignItems: 'baseline',
              py: 1,
            }}
          >
            <Box sx={tableSx.tableHead}>Storms</Box>
            <Box sx={tableSx.tableHead}>Since {FIRST_SEASON}</Box>
          </Flex>
          <Row
            label={`Tropical-storm winds reached (${TROPICAL_STORM_MPH}+ mph)`}
            value={storms.length}
          />
          {storms.length > 0 && (
            <>
              <TooltipWrapper
                tooltip={REACHED_NOTE}
                sx={{ ...tableSx.row, mt: 3, py: 1, gap: 2 }}
                tooltipSx={{ mt: 2, mb: 0 }}
              >
                <Flex
                  sx={{
                    flex: 1,
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <Box sx={tableSx.tableHead}>Storm</Box>
                  <Box sx={tableSx.tableHead}>Reached here</Box>
                </Flex>
              </TooltipWrapper>
              <Box onMouseLeave={() => setHoveredEventId(null)}>
                {storms.map((storm) => (
                  <Row
                    key={storm.sid}
                    label={
                      <>
                        {formatStormName(storm.name)}{' '}
                        <Box as='span' sx={{ color: 'secondary' }}>
                          {storm.season}
                        </Box>
                      </>
                    }
                    value={formatReached(storm.time)}
                    hovered={hoveredEventId === storm.sid}
                    onHover={() => setHoveredEventId(storm.sid)}
                    eye={{
                      checked: selectedStormId === storm.sid,
                      toggle: () =>
                        setSelectedStormId(
                          selectedStormId === storm.sid ? null : storm.sid,
                        ),
                      label: `Show ${formatStormName(storm.name)} ${storm.season} wind extent`,
                    }}
                  />
                ))}
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  )
}

export default HistoricStorms
