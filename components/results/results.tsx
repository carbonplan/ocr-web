import React from 'react'
import { Box, Flex } from 'theme-ui'
import {
  Row,
  Column,
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'
import { getRiskScore } from '@/lib/risk-utils'
import RiskCalculation from './risk-calculation'
import TimeHorizons from './time-horizons'
import OtherFactors from './other-factors'
import RegionalRisk from './regional-risk'

const Results = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const hoveredBuilding = useStore((state) => state.hoveredBuilding)
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)

  const displayBuilding = selectedBuilding || hoveredBuilding

  const colormap = useColormap(riskConfig.colormap, {
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  const riskScore = getRiskScore(displayBuilding, timePeriod)

  const scoreColor = getColorForRiskScore(
    riskScore,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )
  return (
    <>
      <Box variant='sectionHeading' sx={{ mt: 3 }}>
        Risk score
      </Box>
      <Row
        columns={4}
        variant='labelFieldContainer'
        sx={{ mt: 2, display: ['none', 'none', 'block'] }}
      >
        <Column start={1} width={4} sx={{ height: 25 }}>
          <Flex sx={{ gap: 3 }}>
            <Badge sx={{ color: scoreColor }}>
              {riskScore !== null ? `${riskScore.toFixed(2)}%` : '-----'}
            </Badge>
            {selectedBuilding ? null : (
              <Box sx={{ color: 'secondary' }}>
                select a structure to view score
              </Box>
            )}
          </Flex>
        </Column>
      </Row>
      <RiskCalculation />
      <TimeHorizons />
      <RegionalRisk />
      <OtherFactors />
    </>
  )
}

export default Results
