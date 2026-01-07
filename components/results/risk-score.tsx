import { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { Box, Flex } from 'theme-ui'
import { useBreakpointIndex } from '@theme-ui/match-media'

import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
import { useScore } from '@/hooks/useScore'
import ValueBadge from './value-badge'
import ScoreBar from './score-bar'

const RiskScore = () => {
  const ref = useRef<HTMLDivElement>()
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedLocation = useStore((state) => state.selectedLocation)
  const reverseGeocodeLoading = useStore((state) => state.reverseGeocodeLoading)
  const [abbreviate, setAbbreviate] = useState(false)
  const index = useBreakpointIndex({ defaultIndex: 2 })

  const { score, color } = useScore(selectedBuilding, 'muted')

  let content: string | ReactNode = abbreviate
    ? 'Select a building'
    : 'Select a building to view its fire risk'

  if (reverseGeocodeLoading) {
    content = <Box sx={{ color: 'secondary' }}>Loading address...</Box>
  } else if (selectedBuilding && selectedLocation) {
    content =
      formatAddress(selectedLocation.address, {
        abbreviate,
        requireStreet: true,
      }) || 'Selected building'
  }

  useLayoutEffect(() => {
    const lineHeight = index > 2 ? 25 : 22
    const shouldAbbreviate =
      !!ref.current && ref.current.clientHeight > lineHeight
    setAbbreviate(shouldAbbreviate)
  }, [reverseGeocodeLoading, selectedBuilding, selectedLocation, index])

  return (
    <>
      <Box as='h2' variant='sectionHeading' sx={{ mt: 3, mb: 2 }}>
        Risk score
      </Box>
      <Flex sx={{ gap: 3, mb: 3 }}>
        <ValueBadge
          value={score}
          unit='#'
          color={score ? color : undefined}
          sx={{
            fontSize: [4, 4, 4, 4],
            width: [80, 80, 80, 100],
            height: 34,
            flexShrink: 0,
          }}
        />
        <Box ref={ref} sx={{ mt: '10px', variant: 'description' }}>
          {content}
        </Box>
      </Flex>
      <ScoreBar labels axisLabel />
    </>
  )
}

export default RiskScore
