import { Box, Flex } from 'theme-ui'
import { format } from 'd3-format'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { getBinIndex } from '@/hooks/usePeakWind'
import { HISTORIC_FIRES_LAYER_ID, formatFireName } from '@/lib/historic-events'
import type { FireAtPoint } from '@/lib/historic-events/fire-perimeters'
import ValueBadge from '../../value-badge'
import { tableSx } from '../../tooltip-table'

const FIRST_YEAR = 1984
const formatAcres = format(',.0f')
const formatKm = format('.1f')

// Mapped fires whose perimeter contains the selected point, most recent
// first, each colored by ignition decade.
export const useHistoricFires = () => {
  const historicEvents = useStore((state) => state.historicEvents)
  const bins =
    getMapLayer(RISKS.fire, HISTORIC_FIRES_LAYER_ID)?.binBoundaries ?? []
  const colormap = useColormap({ count: bins.length })

  const isFires =
    historicEvents.status === 'success' && historicEvents.kind === 'fires'
  const fires = isFires ? historicEvents.events : null
  const nearest = isFires ? historicEvents.nearest : null
  const colorFor = (fire: FireAtPoint) =>
    colormap[getBinIndex(bins, fire.year) + 1]

  return {
    status: historicEvents.status,
    fires,
    nearest,
    colorFor,
    latestColor: fires?.length ? colorFor(fires[0]) : undefined,
  }
}

const fireLabel = (fire: FireAtPoint) => (
  <>
    {formatFireName(fire.name)}{' '}
    <Box as='span' sx={{ color: 'secondary' }}>
      {fire.year}
      {fire.type && fire.type !== 'Wildfire' ? ` · ${fire.type}` : ''}
    </Box>
  </>
)

const HistoricFires = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const { status, fires, nearest, colorFor } = useHistoricFires()
  const hasSelection = Boolean(selectedBuilding || selectedArea)

  const hoverProps = (fire: FireAtPoint) => ({
    onMouseEnter: () => setHoveredEventId(fire.id),
    onMouseLeave: () => setHoveredEventId(null),
  })

  return (
    <Box>
      Fires since {FIRST_YEAR} whose mapped burned area includes this location.
      Fires smaller than 1,000 acres in the West and 500 acres in the East are
      not mapped.
      {!hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          Select a building to see the fires that burned it.
        </Box>
      )}
      {status === 'error' && hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No fire history is available for this location.
        </Box>
      )}
      {fires && fires.length === 0 && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No mapped fire has burned this location.
          {nearest && (
            <Box as='span' {...hoverProps(nearest)}>
              {' '}
              The nearest was the {formatFireName(nearest.name)} fire (
              {nearest.year}), {formatKm(nearest.distanceKm)} km away.
            </Box>
          )}
        </Box>
      )}
      {fires && fires.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Flex
            sx={{
              ...tableSx.row,
              justifyContent: 'space-between',
              alignItems: 'baseline',
              py: 1,
            }}
          >
            <Box sx={tableSx.tableHead}>Fire</Box>
            <Box sx={tableSx.tableHead}>Burned area</Box>
          </Flex>
          {fires.map((fire) => (
            <Flex
              key={fire.id}
              sx={{
                ...tableSx.row,
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 2,
                py: 2,
                cursor: 'default',
                '&:hover': { color: 'primary' },
              }}
              {...hoverProps(fire)}
            >
              <Box>{fireLabel(fire)}</Box>
              <ValueBadge
                value={`${formatAcres(fire.acres)} ac`}
                color={colorFor(fire)}
                unit='#'
                sx={{ flexShrink: 0 }}
              />
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default HistoricFires
