import { Box, Flex, Grid, ThemeUIStyleObject } from 'theme-ui'
import {
  Chart,
  AxisLabel,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'
import { useShallow } from 'zustand/shallow'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { useScore } from '@/hooks/useScore'
import ValueBadge from './value-badge'

const ScoreBar = ({
  labels,
  axisLabel,
  sx,
}: {
  labels?: boolean
  axisLabel?: boolean
  sx?: ThemeUIStyleObject
}) => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))
  const colormap = useColormap()

  const { score, color } = useScore(selectedBuilding, 'muted')

  return (
    <>
      <Flex
        role='img'
        aria-label={`Risk score scale from 0 to 10${score ? `, selected building has risk score ${score}` : ''}`}
        sx={{
          gap: '2px',
          alignItems: 'flex-start',
          width: '100%',
          ...sx,
        }}
      >
        <Grid
          sx={{
            flexGrow: 1,
            gridTemplateColumns: 'repeat(11, 1fr)',
            gridGap: '2px',
          }}
        >
          <ValueBadge
            value='0'
            unit='#'
            sx={{
              width: '100%',
              backgroundColor: 'muted',
              color: score === '0' ? 'primary' : 'secondary',
            }}
          />
          {Array(10)
            .fill(null)
            .map((el, i) => (
              <Flex key={i} sx={{ position: 'relative' }}>
                {labels && !(i === 0 && bins[0] === 0) && (
                  <>
                    {(() => {
                      const str = String(bins[i])
                      const digitCount = str.replace(/\D/g, '').length
                      const formattedStr =
                        digitCount > 2 ? str.replace(/^0(?=\.)/, '') : str
                      const displayText = `${formattedStr}%${i === bins.length - 1 ? '+' : ''}`
                      return (
                        <>
                          <Box
                            sx={{
                              position: 'absolute',
                              height: `5px`,
                              bottom: '-12px',
                              left: '-2.5px',
                              color:
                                color === colormap[i] ||
                                color === colormap[i - 1]
                                  ? 'primary'
                                  : 'secondary',
                              borderStyle: 'solid',
                              borderWidth: '0px',
                              borderLeftWidth: '1px',
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: '-28px',
                              left: `-${displayText.length * 4.2}px`,
                              fontSize: 0,
                              fontFamily: 'mono',
                              letterSpacing: 'mono',
                              color:
                                color === colormap[i] ||
                                color === colormap[i - 1]
                                  ? 'primary'
                                  : 'secondary',
                              userSelect: 'none',
                              transition: 'color 0.2s',
                            }}
                          >
                            {displayText}
                          </Box>
                        </>
                      )
                    })()}
                  </>
                )}

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
      {axisLabel && (
        <Box sx={{ width: '100%', mt: '56px', pb: 1 }}>
          <Chart x={[0, 1]} y={[0, 1]}>
            <AxisLabel bottom units='%'>
              Risk of loss
            </AxisLabel>
          </Chart>
        </Box>
      )}
    </>
  )
}

export default ScoreBar
