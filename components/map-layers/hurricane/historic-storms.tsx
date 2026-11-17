import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import { useEventSelection, eventRowSx } from '@/hooks/useEventSelection'
import { useLayerColor } from '@/hooks/useLayerColor'
import type { StormAtPoint } from '@/lib/historic-events/storm-tracks'
import {
  HISTORIC_STORMS_LAYER_ID,
  MPH_PER_KT,
  TROPICAL_STORM_MPH,
  formatStormName,
} from '@/lib/historic-events'
import ValueBadge from '../../value-badge'
import TooltipWrapper from '../../tooltip'
import { tableSx } from '../../tooltip-table'

const FIRST_SEASON = 2004

const WIND_NOTE =
  'The storm\u2019s highest sustained wind while its tropical-storm-force winds reached this location, usually near its center rather than here. Distance is how near its center passed.'

const MI_PER_KM = 0.621371

const formatClosest = (km: number) => {
  const mi = Math.round(km * MI_PER_KM)
  return mi < 1 ? '<1 mi away' : `${mi} mi away`
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
  const mph =
    storm.windKt === null ? null : Math.round(storm.windKt * MPH_PER_KT)
  // the track's color at this speed
  const color = useLayerColor(HISTORIC_STORMS_LAYER_ID, mph)
  return (
    <Flex
      sx={{ ...rowSx, ...eventRowSx(isActive(storm.sid)) }}
      {...rowProps(storm.sid, storm.bbox)}
    >
      <Box>
        {formatStormName(storm.name)} {storm.season} ·{' '}
        {formatClosest(storm.closestKm)}
      </Box>
      <ValueBadge
        value={mph === null ? null : `${mph} mph`}
        color={color}
        unit='mph'
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
          <TooltipWrapper
            tooltip={WIND_NOTE}
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
              <Box sx={tableSx.tableHead}>Peak wind</Box>
            </Flex>
          </TooltipWrapper>
          {storms.map((storm) => (
            <StormRow key={storm.sid} storm={storm} />
          ))}
          {storms.length < 1 && (
            <Box sx={{ ...rowSx, color: 'secondary' }}>
              No storms since {FIRST_SEASON}.
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default HistoricStorms
