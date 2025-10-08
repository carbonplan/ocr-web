import React from 'react'
import { Box, ThemeUIStyleObject } from 'theme-ui'
import {
  Column,
  Row,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
  getRiskScore,
} from '@/lib/risk-utils'
import ValueBadge from './value-badge'

const sx = {
  label: {
    fontSize: 1,
    fontFamily: 'mono',
    letterSpacing: 'mono',
    textTransform: 'uppercase',
    mb: 1,
    position: 'relative',
  } as ThemeUIStyleObject,
}
const RiskCalculation = () => {
  const risk = useStore((state) =>
    getRiskScore(state.selectedBuilding, state.timePeriod),
  )
  const bp = useStore((state) =>
    getAdjustedBurnProbability(state.selectedBuilding, state.timePeriod),
  )
  const conditionalRisk = useStore((state) =>
    getConditionalRiskUsfs(state.selectedBuilding),
  )

  return (
    <>
      <Box variant='sectionHeading'>Calculating risk</Box>
      <Row columns={3} variant='labelFieldContainer' sx={{ mt: 0 }}>
        <Column start={1} width={3} sx={{ mb: 2 }}>
          Risk scores are based on an estimation of damage likelihood due to
          wildfire.
        </Column>
        <Column start={1} width={1}>
          <Box sx={sx.label}>
            Risk
            <br />
            of loss
            <Box sx={{ position: 'absolute', top: '12px', left: '80%' }}>=</Box>
          </Box>
          <ValueBadge value={risk} />
        </Column>
        <Column start={2} width={1}>
          <Box sx={sx.label}>
            Burn probability
            <Box
              sx={{
                position: 'absolute',
                top: '12px',
                left: '105%',
                textTransform: 'none',
              }}
            >
              x
            </Box>
          </Box>
          <ValueBadge value={bp} />
        </Column>
        <Column start={3} width={1}>
          <Box sx={sx.label}>Conditional risk</Box>
          <ValueBadge value={conditionalRisk} />
        </Column>
      </Row>
    </>
  )
}

export default RiskCalculation
