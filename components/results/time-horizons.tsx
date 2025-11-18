import { Box } from 'theme-ui'
import {
  Table,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
} from '@/lib/risk-utils'
import ValueBadge from './value-badge'

const getProbabilityOverHorizon = (horizon: number, bp: number | null) =>
  typeof bp === 'number' ? 1 - Math.pow(1 - bp, horizon) : null

const getRiskOverHorizon = (
  horizon: number,
  bp: number | null,
  conditionalRisk: number | null,
) => {
  if (bp == null || conditionalRisk == null) {
    return null
  }

  return (getProbabilityOverHorizon(horizon, bp) ?? 0) * conditionalRisk
}

const TimeHorizons = () => {
  const bp = useStore((state) =>
    getAdjustedBurnProbability(state.selectedBuilding, state.timePeriod),
  )
  const conditionalRisk = useStore((state) =>
    getConditionalRiskUsfs(state.selectedBuilding),
  )
  const values = {
    1: getRiskOverHorizon(1, bp, conditionalRisk),
    15: getRiskOverHorizon(15, bp, conditionalRisk),
    30: getRiskOverHorizon(30, bp, conditionalRisk),
  }

  return (
    <>
      <Box sx={{ mt: 4 }}>
        Over longer time horizons, the annual burn probability and, thus risk of
        loss, compounds.
      </Box>
      <Table
        columns={3}
        start={[1, 2, 3]}
        width={[1, 1, 1]}
        data={[
          ['1 year', '15 years', '30 years'],
          [
            <ValueBadge key={1} value={values['1']} />,
            <ValueBadge key={15} value={values['15']} />,
            <ValueBadge key={30} value={values['30']} />,
          ],
        ]}
        borderTop={false}
        index={false}
        sx={{
          mt: 2,
          '& tr:first-of-type td': {
            fontSize: 1,
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            color: 'secondary',
          },
          '& tr:first-of-type': {
            py: 1,
          },
          '& tr:last-of-type': {
            py: 2,
          },
        }}
      />
    </>
  )
}

export default TimeHorizons
