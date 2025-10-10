import React from 'react'
import { Box, Flex } from 'theme-ui'
import {
  Button,
  Row,
  Column,
  Badge,
  Filter,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Right } from '@carbonplan/icons'
import { useStore } from '@/lib/store'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'
import TooltipWrapper from './tooltip'
import { getRiskScore } from '@/lib/risk-utils'

const Results = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const setTimePeriod = useStore((state) => state.setTimePeriod)
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
    'primary',
  )
  return (
    <>
      <Row columns={4} sx={{ mt: 3, alignItems: 'baseline' }}>
        <Column start={1} width={4} variant='sectionHeading'>
          Climate risk
        </Column>
      </Row>
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
      <Row columns={[3, 3, 4, 4]} variant='labelFieldContainer'>
        <Column start={1} width={1} variant='label'>
          Hazard
        </Column>
        <Column start={2} width={[2, 2, 3, 3]}>
          <Filter
            values={{ Fire: true }}
            setValues={() => {}}
            colors={{ Fire: 'red' }}
          />
        </Column>
      </Row>
      <Row columns={[3, 3, 4, 4]} variant='labelFieldContainer'>
        <Column start={1} width={1} variant='label'>
          Scenario
        </Column>
        <Column start={2} width={[2, 2, 3, 3]}>
          <TooltipWrapper
            tooltip='Current risk estimates are based on a climate circa 2003-2018 while future estimates use a climate representative of 2040-2055. Both estimates use vegetation from 2020.'
            sx={{ justifyContent: 'flex-start', gap: 2 }}
          >
            <Filter
              values={{
                current: timePeriod === 'current',
                future: timePeriod === 'future',
              }}
              labels={{
                current: 'Current',
                future: 'Future',
              }}
              setValues={(values: Record<string, boolean>) => {
                const selectedPeriod = Object.keys(values).find(
                  (key) => values[key],
                )
                if (selectedPeriod === 'current') {
                  setTimePeriod('current')
                } else if (selectedPeriod === 'future') {
                  setTimePeriod('future')
                }
              }}
            />
          </TooltipWrapper>
        </Column>
      </Row>
    </>
  )
}

export default Results
