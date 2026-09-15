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
import EyeCheckbox from '../../eye-checkbox'
import TooltipWrapper from '../../tooltip'
import { tableSx } from '../../tooltip-table'

const FIRST_SEASON = 1980

const MODELED_WIND_NOTE =
  'The peak 1-minute sustained wind the wind hazard model attributes to this storm at this location. Each storm\u2019s NOAA best track (position and maximum wind) is run through the same parametric wind model (Holland 2008, via CLIMADA) and roughly 9 km grid used for the wind hazard maps, so the two are directly comparable. Track segments below tropical-storm strength (34 kt) are drawn faintly and not modeled. These are model estimates, not measurements: the wind at a specific address can differ by tens of mph, especially near the core of small storms.'

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
  }
}

const Row = ({
  label,
  value,
  color,
  hovered = false,
  onHover,
  eye,
}: {
  label: React.ReactNode
  value: string | number | null
  color?: string
  hovered?: boolean
  onHover?: (hovered: boolean) => void
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
    onMouseEnter={onHover ? () => onHover(true) : undefined}
    onMouseLeave={onHover ? () => onHover(false) : undefined}
  >
    <Box>{label}</Box>
    <Flex sx={{ gap: 2, flexShrink: 0 }}>
      <ValueBadge value={value} color={color} unit='#' toFixed={0} />
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
              <TooltipWrapper
                tooltip={MODELED_WIND_NOTE}
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
                  <Box sx={tableSx.tableHead}>Modeled wind</Box>
                </Flex>
              </TooltipWrapper>
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
                  hovered={hoveredEventId === storm.sid}
                  onHover={(hovered) =>
                    setHoveredEventId(hovered ? storm.sid : null)
                  }
                  eye={{
                    checked: selectedStormId === storm.sid,
                    toggle: () =>
                      setSelectedStormId(
                        selectedStormId === storm.sid ? null : storm.sid,
                      ),
                    label: `Show ${formatStormName(storm.name)} ${storm.season} wind field`,
                  }}
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
