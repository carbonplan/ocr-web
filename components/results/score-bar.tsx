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
  const colormap = useColormap()

  const { score, color } = useScore(selectedBuilding, 'muted')

  return (
    <>
      <Flex
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
                {labels && (
                  <>
                    <Box
                      sx={{
                        position: 'absolute',
                        height: `5px`,
                        bottom: '-12px',
                        left: '-2.5px',
                        color:
                          color === colormap[i] || color === colormap[i - 1]
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
                        left: `-${String(bins[i]).length * 6.5}px`,
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
      {labels && (
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
