import React from 'react'
import { Box } from 'theme-ui'
import {
  Column,
  Row,
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

  return (
    <>
      <Box variant='sectionHeading'>Burn probability over time</Box>
      <Row columns={3} variant='labelFieldContainer' sx={{ mt: 0 }}>
        <Column start={1} width={3}>
          Burn probability compounds year over year at every building. This
          means that risk of loss increases as a result. These probabilities
          also become less certain when compounded and considered at larger
          timescales.
        </Column>
      </Row>
      <Table
        columns={3}
        start={[1, 2, 3]}
        width={[1, 1, 1]}
        data={[
          ['1 year', '15 years', '30 years'],
          [
            <ValueBadge key={1} value={bp} />,
            <ValueBadge key={15} value={getProbabilityOverHorizon(15, bp)} />,
            <ValueBadge key={30} value={getProbabilityOverHorizon(30, bp)} />,
          ],
        ]}
        borderTop={false}
        index={false}
        sx={{
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
