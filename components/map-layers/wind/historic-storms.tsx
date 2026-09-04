import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { getBinIndex } from '@/hooks/usePeakWind'
import {
  HISTORIC_STORMS_LAYER_ID,
  HURRICANE_MPH,
  MPH_PER_MS,
  TROPICAL_STORM_MPH,
  formatStormName,
} from '@/lib/historic-events'
import type { StormAtPoint } from '@/lib/historic-events/storm-winds'
import ValueBadge from '../../value-badge'
import { tableSx } from '../../tooltip-table'

const FIRST_SEASON = 1980

// Storms at the selected point, strongest first, each colored by the
// Saffir-Simpson bin of the wind it brought there.
export const useHistoricStorms = () => {
  const historicEvents = useStore((state) => state.historicEvents)
  const bins =
    getMapLayer(RISKS.wind, HISTORIC_STORMS_LAYER_ID)?.binBoundaries ?? []
  const colormap = useColormap({ count: bins.length })

  const storms =
    historicEvents.status === 'success' && historicEvents.kind === 'storms'
      ? historicEvents.events
      : null
  const colorFor = (storm: StormAtPoint) =>
    colormap[getBinIndex(bins, storm.wind * MPH_PER_MS) + 1]

  return {
    status: historicEvents.status,
    storms,
    colorFor,
    strongestColor: storms?.length ? colorFor(storms[0]) : undefined,
  }
}

const Row = ({
  label,
  value,
  color,
  onHover,
}: {
  label: React.ReactNode
  value: string | number | null
  color?: string
  onHover?: (hovered: boolean) => void
}) => (
  <Flex
    sx={{
      ...tableSx.row,
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 2,
      py: 2,
      ...(onHover
        ? { cursor: 'default', '&:hover': { color: 'primary' } }
        : {}),
    }}
    onMouseEnter={onHover ? () => onHover(true) : undefined}
    onMouseLeave={onHover ? () => onHover(false) : undefined}
  >
    <Box>{label}</Box>
    <ValueBadge value={value} color={color} unit='#' sx={{ flexShrink: 0 }} />
  </Flex>
)

const HistoricStorms = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const { status, storms, colorFor } = useHistoricStorms()
  const hasSelection = Boolean(selectedBuilding || selectedArea)

  const hurricaneCount =
    storms?.filter((storm) => storm.wind * MPH_PER_MS >= HURRICANE_MPH)
      .length ?? null

  return (
    <Box>
      Tropical cyclones since {FIRST_SEASON} whose modeled winds reached
      tropical-storm strength ({TROPICAL_STORM_MPH}+ mph) at this location, with
      the peak 1-min sustained wind each brought here.
      {!hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          Select a building to see the storms that affected it.
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
            <Box sx={tableSx.tableHead}>Storm winds</Box>
            <Box sx={tableSx.tableHead}>Since {FIRST_SEASON}</Box>
          </Flex>
          <Row
            label={`Tropical storm force (${TROPICAL_STORM_MPH}+ mph)`}
            value={storms.length}
          />
          <Row
            label={`Hurricane force (${HURRICANE_MPH}+ mph)`}
            value={hurricaneCount}
          />
          {storms.length > 0 && (
            <>
              <Flex
                sx={{
                  ...tableSx.row,
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  mt: 3,
                  py: 1,
                }}
              >
                <Box sx={tableSx.tableHead}>Storm</Box>
                <Box sx={tableSx.tableHead}>Peak wind</Box>
              </Flex>
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
                  value={`${Math.round(storm.wind * MPH_PER_MS)} mph`}
                  color={colorFor(storm)}
                  onHover={(hovered) =>
                    setHoveredEventId(hovered ? storm.sid : null)
                  }
                />
              ))}
            </>
          )}
        </Box>
      )}
    </Box>
  )
}

export default HistoricStorms
