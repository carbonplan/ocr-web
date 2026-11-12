import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { getBinIndex } from '@/hooks/useLayerColor'
import {
  HISTORIC_STORMS_LAYER_ID,
  HURRICANE_MPH,
  MPH_PER_KT,
  TROPICAL_STORM_MPH,
  formatStormName,
} from '@/lib/historic-events'
import type { StormAtPoint } from '@/lib/historic-events/storm-tracks'
import ValueBadge from '../../value-badge'
import EyeCheckbox from '../../eye-checkbox'
import TooltipWrapper from '../../tooltip'
import { tableSx } from '../../tooltip-table'

const FIRST_SEASON = 2004

const MAX_WIND_NOTE =
  'The strongest 1-minute sustained wind NOAA recorded for the storm while its tropical-storm-force winds reached this location. A storm reached the location when it lies within the storm\u2019s 34 kt wind radius (the largest of its four quadrant radii) along the best track. This is the storm\u2019s own peak intensity at the time, not the wind at this address, which was usually lower. Storms start in 2004, when best tracks began recording wind radii routinely.'

// Storms at the selected point, strongest first, each colored by the
// Saffir-Simpson bin of the wind it brought there.
export const useHistoricStorms = () => {
  const historicEvents = useStore((state) => state.historicEvents)
  const bins =
    getMapLayer(RISKS.hurricane, HISTORIC_STORMS_LAYER_ID)?.binBoundaries ?? []
  const colormap = useColormap({ count: bins.length })

  const storms =
    historicEvents.status === 'success' && historicEvents.kind === 'storms'
      ? historicEvents.events
      : null
  const colorFor = (storm: StormAtPoint) =>
    colormap[getBinIndex(bins, storm.wind * MPH_PER_KT) + 1]

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
    storms?.filter((storm) => storm.wind * MPH_PER_KT >= HURRICANE_MPH)
      .length ?? null

  return (
    <Box>
      Tropical cyclones since {FIRST_SEASON} whose tropical-storm-force winds (
      {TROPICAL_STORM_MPH}+ mph) reached this location by NOAA&apos;s best
      track, with each storm&apos;s strongest recorded wind while they did.
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
          <Row
            label={`As a hurricane (${HURRICANE_MPH}+ mph)`}
            value={hurricaneCount}
          />
          {storms.length > 0 && (
            <>
              <TooltipWrapper
                tooltip={MAX_WIND_NOTE}
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
                  <Box sx={tableSx.tableHead}>Max wind</Box>
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
                    value={`${Math.round(storm.wind * MPH_PER_KT)} mph`}
                    color={colorFor(storm)}
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
