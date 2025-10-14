import React from 'react'
import { Box, Flex } from 'theme-ui'

import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
import { useScore } from '@/hooks/useScore'
import ValueBadge from './value-badge'
import ScoreBar from './score-bar'

const RiskScore = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const hoveredBuilding = useStore((state) => state.hoveredBuilding)
  const selectedLocation = useStore((state) => state.selectedLocation)

  const displayBuilding = selectedBuilding || hoveredBuilding
  const { score, color } = useScore(displayBuilding, 'muted')

  return (
    <>
      <Box variant='sectionHeading' sx={{ mt: 3 }}>
        Risk score
      </Box>
      <Flex sx={{ gap: 3 }}>
        <ValueBadge
          value={score}
          unit='#'
          color={color}
          sx={{
            fontSize: [4, 4, 4, 5],
            width: [80, 80, 80, 150],
            height: [32, 32, 32, 40],
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <Box variant='description'>
          {selectedBuilding && selectedLocation ? (
            <>
              {formatAddress(selectedLocation.address, true) || 'This building'}{' '}
              has a risk score of {score} out of 10
            </>
          ) : (
            'Select a building to view its fire risk'
          )}
        </Box>
      </Flex>
      <ScoreBar sx={{ mt: 3 }} labels />
    </>
  )
}

export default RiskScore
