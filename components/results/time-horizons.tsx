import { Box } from 'theme-ui'
import {
  Table,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { getAdjustedBurnProbability } from '@/lib/risk-utils'
import ValueBadge from './value-badge'

const getProbabilityOverHorizon = (horizon: number, prob?: number | null) =>
  typeof prob === 'number'
    ? (1 - Math.pow(1 - prob / 100, horizon)) * 100
    : null

const TimeHorizons = () => {
  const bp = useStore((state) =>
    getAdjustedBurnProbability(state.selectedBuilding, state.timePeriod),
  )
  const values = {
    1: bp,
    15: getProbabilityOverHorizon(15, bp),
    30: getProbabilityOverHorizon(30, bp),
  }

  return (
    <>
      <Box sx={{ mt: 4 }}>
        Over longer time horizons, burn probability and uncertainty increase.
      </Box>
      <Table
        columns={3}
        start={[1, 2, 3]}
        width={[1, 1, 1]}
        data={[
          ['1 year', '15 years', '30 years'],
          [
            <ValueBadge
              key={1}
              value={values['1']}
              lowValue={values['1'] ? values['1'] < 0.01 : false}
            />,
            <ValueBadge
              key={15}
              value={values['15']}
              lowValue={values['15'] ? values['15'] < 0.01 : false}
            />,
            <ValueBadge
              key={30}
              value={values['30']}
              lowValue={values['30'] ? values['30'] < 0.01 : false}
            />,
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
