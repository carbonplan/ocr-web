import { Box, Flex } from 'theme-ui'
import { format } from 'd3-format'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { getBinIndex } from '@/hooks/usePeakWind'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'
import { NEAR_KM, type FloodAtPoint } from '@/lib/historic-events/flood-reports'
import ValueBadge from '../../value-badge'
import { tableSx } from '../../tooltip-table'

const formatDollars = (value: number) =>
  value > 0 ? format('$.2~s')(value).replace('G', 'B') : '$0'

const formatMonth = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

// NWS flood reports near the selected point, most recent first, each colored
// by report year.
export const useHistoricFloods = () => {
  const historicEvents = useStore((state) => state.historicEvents)
  const bins =
    getMapLayer(RISKS.flood, HISTORIC_FLOODS_LAYER_ID)?.binBoundaries ?? []
  const colormap = useColormap({ count: bins.length })

  const floods =
    historicEvents.status === 'success' && historicEvents.kind === 'floods'
      ? historicEvents.events
      : null
  const colorFor = (flood: FloodAtPoint) =>
    colormap[getBinIndex(bins, flood.year) + 1]

  return {
    status: historicEvents.status,
    floods,
    colorFor,
  }
}

const floodLabel = (flood: FloodAtPoint) => (
  <>
    {flood.type}{' '}
    <Box as='span' sx={{ color: 'secondary' }}>
      {formatMonth(flood.beginDate)}
      {flood.location ? ` · ${flood.location}` : ''}
    </Box>
  </>
)

const HistoricFloods = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const { status, floods, colorFor } = useHistoricFloods()
  const hasSelection = Boolean(selectedBuilding || selectedArea)

  const hoverProps = (flood: FloodAtPoint) => ({
    onMouseEnter: () => setHoveredEventId(String(flood.id)),
    onMouseLeave: () => setHoveredEventId(null),
  })

  return (
    <Box>
      Flood and flash flood reports from the National Weather Service within{' '}
      {NEAR_KM} km of this location. Reports mark where flooding was observed or
      caused damage; mapped locations begin in 2005 and are sparse before 2007.
      {!hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          Select a location to see its flood history.
        </Box>
      )}
      {status === 'error' && hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No flood history is available for this location.
        </Box>
      )}
      {floods && floods.length === 0 && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No flood has been reported within {NEAR_KM} km of this location.
        </Box>
      )}
      {floods && floods.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Flex
            sx={{
              ...tableSx.row,
              justifyContent: 'space-between',
              alignItems: 'baseline',
              py: 1,
            }}
          >
            <Box sx={tableSx.tableHead}>Report</Box>
            <Box sx={tableSx.tableHead}>Damage</Box>
          </Flex>
          {floods.map((flood) => (
            <Flex
              key={flood.id}
              sx={{
                ...tableSx.row,
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 2,
                py: 2,
                cursor: 'default',
                '&:hover': { color: 'primary' },
              }}
              {...hoverProps(flood)}
            >
              <Box>{floodLabel(flood)}</Box>
              <ValueBadge
                value={formatDollars(flood.damage)}
                color={colorFor(flood)}
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

export default HistoricFloods
