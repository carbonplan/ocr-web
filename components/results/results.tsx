import React from 'react'
import { Box, Flex } from 'theme-ui'
import {
  Button,
  Row,
  Column,
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Right } from '@carbonplan/icons'
import { useStore } from '@/lib/store'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'
import { getRiskScore } from '@/lib/risk-utils'
import RiskCalculation from './risk-calculation'
import TimeHorizons from './time-horizons'
import OtherFactors from './other-factors'

const Results = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const hoveredBuilding = useStore((state) => state.hoveredBuilding)
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)
  const showAddressDetails = useStore((state) => state.showAddressDetails)
  const setShowAddressDetails = useStore((state) => state.setShowAddressDetails)

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
            {selectedBuilding ? (
              <Button
                variant='label'
                suffix={
                  <Right
                    sx={{
                      mt: -1,
                      transform: showAddressDetails
                        ? 'scaleX(-1) rotate(45deg) '
                        : 'rotate(45deg) scaleX(1)',
                    }}
                  />
                }
                inverted
                size='xs'
                onClick={() => setShowAddressDetails(!showAddressDetails)}
                sx={{
                  fontFamily: 'mono',
                  fontSize: [2, 2, 2, 3],
                  color: 'secondary',
                  letterSpacing: 'smallcaps',
                }}
              >
                About this score
              </Button>
            ) : (
              <Box sx={{ color: 'secondary' }}>
                select a structure to view score
              </Box>
            )}
          </Flex>
        </Column>
      </Row>
      <RiskCalculation />
      <TimeHorizons />
      <OtherFactors />
    </>
  )
}

export default Results
