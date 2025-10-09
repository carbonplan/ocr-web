import React, { useMemo } from 'react'
import { Box, Flex } from 'theme-ui'
import {
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import {
  Chart,
  AxisLabel,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import { mix } from '@theme-ui/color'
import { useShallow } from 'zustand/shallow'
import { useStore } from '@/lib/store'
import { useColormap, useScoreColor } from '@/lib/colormaps'
import { getRiskScore } from '@/lib/risk-utils'
import { formatAddress } from '@/lib/address-utils'
import ValueBadge from './value-badge'

const RiskScore = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const hoveredBuilding = useStore((state) => state.hoveredBuilding)
  const selectedLocation = useStore((state) => state.selectedLocation)
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))
  const colormap = useColormap()

  const displayBuilding = selectedBuilding || hoveredBuilding

  const riskScore = getRiskScore(displayBuilding, timePeriod)
  const integerScore = useMemo(() => {
    if (typeof riskScore === 'number') {
      return (
        bins.findIndex((bin, i) =>
          i === bins.length - 1 && riskScore >= bin
            ? i
            : riskScore >= bin && riskScore < bins[i + 1],
        ) + 1
      )
    } else {
      return null
    }
  }, [riskScore, bins])
  const scoreColor = useScoreColor(riskScore, 'muted')

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
            backgroundColor: scoreColor,
            flexShrink: 0,
          }}
        >
          {displayBuilding ? integerScore : '#'}
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
              of {integerScore} out of 10
            </>
          ) : (
            'Select a building to view its fire risk'
          )}
        </Box>
      </Flex>
      <Flex sx={{ gap: '2px', mt: 3, alignItems: 'flex-start' }}>
        <ValueBadge
          value='0'
          unit='#'
          sx={{
            backgroundColor: 'muted',
            color: integerScore === 0 ? 'primary' : 'secondary',
          }}
        />
        {Array(10)
          .fill(null)
          .map((el, i) => (
            <Box key={i} sx={{ flexGrow: 1, position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  height: `5px`,
                  bottom: '-10px',
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
                  bottom: '-26px',
                  left: `-${String(bins[i]).length * 4 + 4}px`,
                  fontSize: 0,
                  fontFamily: 'mono',
                  letterSpacing: 'mono',
                  color:
                    scoreColor === colormap[i] || scoreColor === colormap[i - 1]
                      ? 'primary'
                      : 'secondary',
                  userSelect: 'none',
                  transition: 'color 0.2s',
                }}
              >
                {bins[i]}%
              </Box>

              <ValueBadge
                value={`${i + 1}`}
                unit='#'
                sx={{
                  width: '100%',
                  color: mix('primary', 'background', 0.999 ** (i * i * i)),
                  backgroundColor: colormap[i],
                }}
              />
            </Box>
          ))}
      </Flex>
      <Box sx={{ width: '100%', mt: 6, pb: 1 }}>
        <Chart x={[0, 1]} y={[0, 1]}>
          <AxisLabel bottom units='%'>
            Risk of loss
          </AxisLabel>
        </Chart>
      </Box>
    </>
  )
}

export default RiskScore
