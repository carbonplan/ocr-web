import { Box } from 'theme-ui'
import {
  Table,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { getAdjustedBurnProbability } from '@/lib/risk-utils'
import ValueBadge from './value-badge'
import TooltipWrapper from '../tooltip'

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
      <TooltipWrapper
        tooltip='Burn probability compounds year over year at every building. This means
        that risk of loss increases as a result. These probabilities also become
        less certain when compounded and considered at larger timescales.'
        sx={{
          justifyContent: 'flex-start',
          gap: 2,
          alignItems: 'baseline',
        }}
        buttonSx={{
          position: 'relative',
          top: '1px',
        }}
        tooltipSx={{ mt: -1, mb: 3 }}
      >
        <Box variant='sectionHeading'>Burn probability over time</Box>
      </TooltipWrapper>
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
