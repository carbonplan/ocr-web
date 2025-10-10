import React from 'react'
import { Box, Flex, Grid } from 'theme-ui'
import {
  Chart,
  AxisLabel,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import { useShallow } from 'zustand/shallow'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { formatAddress } from '@/lib/address-utils'
import { useScore } from '@/hooks/useScore'
import ValueBadge from './value-badge'

const RiskScore = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const hoveredBuilding = useStore((state) => state.hoveredBuilding)
  const selectedLocation = useStore((state) => state.selectedLocation)
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))
  const colormap = useColormap()

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
              {formatAddress(selectedLocation.address, true) || 'This building'}{' '}
              has a risk score of {score} out of 10
            </>
          ) : (
            'Select a building to view its fire risk'
          )}
        </Box>
      </Flex>
      <Flex sx={{ gap: '2px', mt: 3, alignItems: 'flex-start', width: '100%' }}>
        <ValueBadge
          value='0'
          unit='#'
          sx={{
            backgroundColor: 'muted',
            color: score === '0' ? 'primary' : 'secondary',
          }}
        />
        <Grid
          sx={{
            flexGrow: 1,
            gridTemplateColumns: 'repeat(10, 1fr)',
            gridGap: '2px',
          }}
        >
          {Array(10)
            .fill(null)
            .map((el, i) => (
              <Flex key={i} sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    height: `5px`,
                    bottom: '-12px',
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
                    bottom: '-28px',
                    left: `-${String(bins[i]).length * 4 + 4}px`,
                    fontSize: 0,
                    fontFamily: 'mono',
                    letterSpacing: 'mono',
                    color:
                      color === colormap[i] || color === colormap[i - 1]
                        ? 'primary'
                        : 'secondary',
                    userSelect: 'none',
                    transition: 'color 0.2s',
                  }}
                >
                  {bins[i]}%{i === bins.length - 1 ? '+' : ''}
                </Box>

                <ValueBadge
                  value={`${i + 1}`}
                  unit='#'
                  color={colormap[i]}
                  sx={{ width: '100%' }}
                />
              </Flex>
            ))}
        </Grid>
      </Flex>
      <Box sx={{ width: '100%', mt: '56px', pb: 1 }}>
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
