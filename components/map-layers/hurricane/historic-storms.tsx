import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import { useEventSelection, eventRowSx } from '@/hooks/useEventSelection'
import type { StormAtPoint } from '@/lib/historic-events/storm-tracks'
import { TROPICAL_STORM_MPH, formatStormName } from '@/lib/historic-events'
import ValueBadge from '../../value-badge'
import TooltipWrapper from '../../tooltip'
import { tableSx } from '../../tooltip-table'

const FIRST_SEASON = 2004

const CLOSEST_NOTE = 'How near the storm\u2019s center passed this location.'

const MI_PER_KM = 0.621371

const formatClosest = (km: number) => {
  const mi = Math.round(km * MI_PER_KM)
  return mi < 1 ? '<1 mi' : `${mi} mi`
}

// Storms at the selected point, most recent first
export const useHistoricStorms = () => {
  const historicEvents = useStore((state) => state.historicEvents)
  const storms =
    historicEvents.status === 'success' && historicEvents.kind === 'storms'
      ? historicEvents.events
      : null
  return { status: historicEvents.status, storms }
}

const rowSx = {
  ...tableSx.row,
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 2,
  py: 2,
}

// selecting a storm also draws its modeled wind field
const StormRow = ({ storm }: { storm: StormAtPoint }) => {
  const { rowProps, isActive } = useEventSelection()
  return (
    <Flex
      sx={{ ...rowSx, ...eventRowSx(isActive(storm.sid)) }}
      {...rowProps(storm.sid, storm.bbox)}
    >
      <Box>
        {formatStormName(storm.name)}{' '}
        <Box as='span' sx={{ color: 'secondary' }}>
          {storm.season}
        </Box>
      </Box>
      <ValueBadge
        value={formatClosest(storm.closestKm)}
        unit='#'
        toFixed={0}
        sx={{ flexShrink: 0 }}
      />
    </Flex>
  )
}

const HistoricStorms = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const { status, storms } = useHistoricStorms()
  const hasSelection = Boolean(selectedBuilding || selectedArea)

  return (
    <Box>
      Tropical cyclones since {FIRST_SEASON} whose tropical-storm-force winds (
      {TROPICAL_STORM_MPH}+ mph) reached this location by NOAA&apos;s best
      track, and how near each passed.
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
          <Flex sx={rowSx}>
            <Box>Tropical-storm winds reached ({TROPICAL_STORM_MPH}+ mph)</Box>
            <ValueBadge
              value={storms.length}
              unit='#'
              toFixed={0}
              sx={{ flexShrink: 0 }}
            />
          </Flex>
          {storms.length > 0 && (
            <>
              <TooltipWrapper
                tooltip={CLOSEST_NOTE}
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
                  <Box sx={tableSx.tableHead}>Closest pass</Box>
                </Flex>
              </TooltipWrapper>
              {storms.map((storm) => (
                <StormRow key={storm.sid} storm={storm} />
              ))}
            </>
          )}
        </Box>
      )}
    </Box>
  )
}

export default HistoricStorms
