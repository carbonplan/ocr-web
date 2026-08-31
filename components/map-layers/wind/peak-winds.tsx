import { Box, Flex } from 'theme-ui'
import { format } from 'd3-format'
import {
  Select,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

import { useStore } from '@/lib/store'
import { getMapLayer } from '@/lib/hazards'

import ValueBadge from '../../value-badge'
import WindCurve from './wind-curve'
import { tableSx } from '../../tooltip-table'

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
      <Flex
        sx={{
          ...tableSx.row,
          justifyContent: 'space-between',
          alignItems: 'baseline',
          py: 1,
        }}
      >
        <Box sx={tableSx.tableHead}>Storm winds</Box>
        <Box sx={tableSx.tableHead}>Frequency</Box>
      </Flex>
      {rows.map(({ label, years }) => (
        <Flex
          key={label}
          sx={{
            ...tableSx.row,
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 2,
            py: 2,
          }}
        >
          <Box>{label}</Box>
          <ValueBadge
            value={years === null ? null : `${formatYears(years)} yrs`}
            unit='yrs'
            sx={{ flexShrink: 0 }}
          />
        </Flex>
      ))}
    </Box>
  )
}

const PeakWinds = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const riskConfig = useStore((state) => state.riskConfig)
  const mapLayer = useStore((state) => state.mapLayer)
  const returnPeriod = useStore((state) => state.selectorValues.return_period)
  const setSelectorValues = useStore((state) => state.setSelectorValues)

  const activeLayer = getMapLayer(riskConfig, mapLayer)

  const detail =
    buildingQuery.status === 'success' ? buildingQuery.detail : undefined

  if (!activeLayer || !activeLayer.selector || !returnPeriod) return

  const returnPeriods = activeLayer.selector.values

  return (
    <Box>
      The peak 1-min sustained wind speed associated with a 1-in-
      <Select
        value={returnPeriod}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSelectorValues({ return_period: Number(e.target.value) })
        }
        size='xs'
        sx={{ mb: ['-5px'] }}
      >
        {returnPeriods.map((rp) => (
          <option key={rp} value={rp}>
            {rp}
          </option>
        ))}
      </Select>{' '}
      year rarity storm at this location.
      <WindCurve
        returnPeriod={returnPeriod}
        returnPeriods={detail?.returnPeriods}
        windSpeed={detail?.windSpeed}
        windSpeedLower={detail?.windSpeedLower}
        windSpeedUpper={detail?.windSpeedUpper}
        unitScale={activeLayer.unitScale}
        color={riskConfig.accentColor}
      />
      <RecurrenceTable
        rp33={detail?.rpExceed33 ?? null}
        rp50={detail?.rpExceed50 ?? null}
      />
      {buildingQuery.status === 'error' &&
        (selectedBuilding || selectedArea) && (
          <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
            No wind data is available for this location.
          </Box>
        )}
    </Box>
  )
}

export default PeakWinds
