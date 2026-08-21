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
  sx,
}: {
  labels?: boolean
  sx?: ThemeUIStyleObject
}) => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))
  const axisLabel = useStore((state) => state.riskConfig.axisLabel)
  const valueDisplay = useStore((state) => state.riskConfig.valueDisplay)
  const colormap = useColormap()

  const { score, value, color } = useScore(selectedBuilding, 'muted')

  const selectionLabel = score
    ? valueDisplay
      ? `, selection reads ${valueDisplay.format(value!)}`
      : `, selected building has risk score ${score} (${bins[Number(score) - 1]}% to ${bins[Number(score)]}%)`
    : ''

  return (
    <>
      <Flex
        role='img'
        aria-label={`${valueDisplay ? `${axisLabel} scale` : 'Risk score scale from 0 to 10'}${selectionLabel}`}
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
          {Array(11)
            .fill(null)
            .map((el, i) => (
              <Flex key={i} sx={{ position: 'relative' }}>
                {labels && (
                  <>
                    {(() => {
                      if (i < 2) return
                      const str = String(bins[i - 1])
                      const digitCount = str.replace(/\D/g, '').length
                      const formattedStr =
                        digitCount > 2 ? str.replace(/^0(?=\.)/, '') : str
                      const displayText = `${formattedStr}%${i === bins.length ? '+' : ''}`
                      return (
                        <>
                          <Box
                            sx={{
                              position: 'absolute',
                              height: `5px`,
                              bottom: '-12px',
                              left: '-1.5px',
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
                              bottom: ['-28px', '-28px', '-28px', '-31px'],
                              left: '-1px',
                              transform: 'translateX(-50%)',
                              fontSize: [0, 0, 0, 1],
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
                  value={`${i}`}
                  unit='#'
                  color={colormap[i]}
                  sx={{
                    width: '100%',
                    ...(i === 0 && score !== '0' ? { color: 'secondary' } : {}),
                  }}
                />
              </Flex>
            ))}
        </Grid>
      </Flex>
      <Box sx={{ width: '100%', mt: '50px', pb: 1 }}>
        <Chart x={[0, 1]} y={[0, 1]}>
          <AxisLabel
            bottom
            units='%'
            sx={{
              color: 'secondary',
              '& svg': { fill: 'secondary' },
            }}
          >
            {axisLabel}
          </AxisLabel>
        </Chart>
      </Box>
    </>
  )
}

export default ScoreBar
