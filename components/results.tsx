import React from 'react'
import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column, Badge } from '@carbonplan/components'
import { useLocationStore } from '@/store/location'
import { RISK_ATTRIBUTES } from '@/lib/config'

const Results = () => {
  const selectedBuilding = useLocationStore((state) => state.selectedBuilding)
  const wind = useLocationStore((state) => state.wind)
  const riskAttribute = wind
    ? RISK_ATTRIBUTES.windRisk
    : RISK_ATTRIBUTES.baseRisk

  const calculateRiskScores = (annualProbability: number) => {
    const annual = annualProbability * 100
    const fifteenYear = (1 - Math.pow(1 - annualProbability, 15)) * 100
    const thirtyYear = (1 - Math.pow(1 - annualProbability, 30)) * 100

    return {
      annual: annual.toFixed(2),
      fifteenYear: fifteenYear.toFixed(2),
      thirtyYear: thirtyYear.toFixed(2),
    }
  }

  const riskScores =
    selectedBuilding && selectedBuilding[riskAttribute]
      ? calculateRiskScores(Number(selectedBuilding[riskAttribute]))
      : null

  return (
    <>
      <Row columns={4} sx={{ my: 3, alignItems: 'baseline' }}>
        <Column start={1} width={1} variant='sectionHeading'>
          Results
        </Column>
        <Column start={2} width={3}>
          {!riskScores && (
            <Box
              variant='field'
              sx={{ fontSize: 1, color: 'secondary', textTransform: 'none' }}
            >
              Select a structure
            </Box>
          )}
        </Column>
      </Row>
      <>
        <Row columns={4} sx={{ my: 2 }}>
          <Column
            start={1}
            width={1}
            variant='label'
            sx={{ textWrap: 'nowrap' }}
          >
            01-Year
          </Column>
          <Column start={2} width={3} sx={{ height: 25 }}>
            <Badge sx={{ color: 'red' }}>
              {riskScores ? `${riskScores.annual}%` : '—'}
            </Badge>
          </Column>
        </Row>

        <Row columns={4} sx={{ my: 2 }}>
          <Column
            start={1}
            width={1}
            variant='label'
            sx={{ textWrap: 'nowrap' }}
          >
            15-Year
          </Column>
          <Column start={2} width={3} sx={{ height: 25 }}>
            <Badge sx={{ color: 'red' }}>
              {riskScores ? `${riskScores.fifteenYear}%` : '—'}
            </Badge>
          </Column>
        </Row>

        <Row columns={4} sx={{ my: 2 }}>
          <Column
            start={1}
            width={1}
            variant='label'
            sx={{ textWrap: 'nowrap' }}
          >
            30-Year
          </Column>
          <Column start={2} width={3} sx={{ height: 25 }}>
            <Badge sx={{ color: 'red' }}>
              {riskScores ? `${riskScores.thirtyYear}%` : '—'}
            </Badge>
          </Column>
        </Row>

        {/* <Box variant='label' sx={{ my: 2 }}>
            About this score
          </Box> */}
      </>
    </>
  )
}

export default Results
