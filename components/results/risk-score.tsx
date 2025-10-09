import React from 'react'
import { Box, Flex } from 'theme-ui'
import {
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'
import { getRiskScore } from '@/lib/risk-utils'
import { formatAddress } from '@/lib/address-utils'
import ValueBadge from './value-badge'

const RiskScore = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const hoveredBuilding = useStore((state) => state.hoveredBuilding)
  const selectedLocation = useStore((state) => state.selectedLocation)
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
    'primary',
  )

  return (
    <>
      <Box variant='sectionHeading' sx={{ mt: 3 }}>
        Risk score
      </Box>
      <Flex sx={{ gap: 3 }}>
        <Badge
          sx={{
            fontSize: [4, 4, 4, 5],
            width: [80, 80, 80, 150],
            height: [32, 32, 32, 40],
            color: scoreColor,
            flexShrink: 0,
          }}
        >
          {displayBuilding ? riskScore?.toFixed(2) : '#'}
        </Badge>
        <Box
          sx={{
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            fontSize: 1,
            lineHeight: 1.2,
          }}
        >
          {selectedBuilding && selectedLocation ? (
            <>
              {formatAddress(selectedLocation.address, true)} has a risk score
              of TK out of 10
            </>
          ) : (
            'Select a building to view its fire risk'
          )}
        </Box>
      </Flex>
      <Flex sx={{ gap: 1, mt: 3, alignItems: 'flex-start' }}>
        <ValueBadge
          value='0'
          unit='#'
          sx={{ backgroundColor: 'muted', color: 'secondary' }}
        />
        {Array(10)
          .fill(null)
          .map((el, i) => (
            <Box key={i} sx={{ flexGrow: 1, position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  height: `5px`,
                  bottom: '-8px',
                  left: '-2.5px',
                  borderColor: 'secondary',
                  borderStyle: 'solid',
                  borderWidth: '0px',
                  borderLeftWidth: '1px',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '-24px',
                  left: '-8px',
                  fontSize: 0,
                  fontFamily: 'mono',
                  letterSpacing: 'mono',
                  color: 'secondary',
                  userSelect: 'none',
                }}
              >
                TK
              </Box>

              <ValueBadge value={`${i + 1}`} unit='#' sx={{ width: '100%' }} />
            </Box>
          ))}
      </Flex>
    </>
  )
}

export default RiskScore
