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

  return (
    <>
      <Box variant='sectionHeading' sx={{ my: 3 }}>
        Results
      </Box>
      <>
        <Row columns={4} sx={{ my: 2 }}>
          <Column
            start={1}
            width={1}
            variant='label'
            sx={{ textWrap: 'nowrap' }}
          >
            Risk Score
          </Column>
          <Column start={2} width={3} sx={{ height: 25 }}>
            {selectedBuilding && selectedBuilding[riskAttribute] ? (
              <Badge sx={{ color: 'red' }}>
                {Number(selectedBuilding[riskAttribute]).toFixed(3)}
              </Badge>
            ) : (
              <Box variant='field' sx={{ fontSize: 1, color: 'muted' }}>
                Select a structure
              </Box>
            )}
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
