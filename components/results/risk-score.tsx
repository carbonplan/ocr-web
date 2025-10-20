import { Box, Flex } from 'theme-ui'

import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
import { useScore } from '@/hooks/useScore'
import ValueBadge from './value-badge'
import ScoreBar from './score-bar'

const scoreHeight = [34, 34, 34, 45]

const RiskScore = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const hoveredBuilding = useStore((state) => state.hoveredBuilding)
  const selectedLocation = useStore((state) => state.selectedLocation)
  const reverseGeocodeLoading = useStore((state) => state.reverseGeocodeLoading)

  const displayBuilding = selectedBuilding || hoveredBuilding
  const { score, color } = useScore(displayBuilding, 'muted')

  return (
    <>
      <Box variant='sectionHeading' sx={{ mt: 3 }}>
        Risk score
      </Box>
      <Flex
        sx={{
          gap: 3,
          alignItems: 'flex-end',
        }}
      >
        <ValueBadge
          value={score}
          unit='#'
          color={color}
          sx={{
            fontSize: [4, 4, 4, 5],
            width: [80, 80, 80, 100],
            height: scoreHeight,
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <Box
          sx={{
            lineHeight: 1,
          }}
        >
          {selectedBuilding && selectedLocation && !reverseGeocodeLoading ? (
            <>
              {formatAddress(selectedLocation.address, true) || 'This building'}{' '}
              has a risk score of {score} out of 10
            </>
          ) : reverseGeocodeLoading ? (
            <Box sx={{ color: 'secondary' }}>Loading address...</Box>
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
