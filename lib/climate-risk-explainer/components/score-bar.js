import { Box, Flex, Grid } from 'theme-ui'
import { Chart, AxisLabel } from '@carbonplan/charts'
import ValueBadge from './value-badge'
import { BIN_BOUNDARIES, useColormap } from './use-colormap'

const ScoreBar = ({ labels = true, axisLabel = 'Risk of loss', sx }) => {
  const colormap = useColormap()

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
              color: 'secondary',
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
                        color: 'secondary',
                        borderStyle: 'solid',
                        borderWidth: '0px',
                        borderLeftWidth: '1px',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: '-28px',
                        left: `-${String(BIN_BOUNDARIES[i]).length * 4.0}px`,
                        fontSize: 0,
                        fontFamily: 'mono',
                        letterSpacing: 'mono',
                        color: 'secondary',
                        userSelect: 'none',
                        transition: 'color 0.2s',
                      }}
                    >
                      {String(BIN_BOUNDARIES[i]).replace(/^0(?=\.)/, '')}
                      {i === BIN_BOUNDARIES.length - 1 ? '+' : ''}
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
      {axisLabel && (
        <Box sx={{ width: '100%', mt: '56px', pb: 1 }}>
          <Chart x={[0, 1]} y={[0, 1]}>
            <AxisLabel bottom units='%'>
              {axisLabel}
            </AxisLabel>
          </Chart>
        </Box>
      )}
    </>
  )
}

export default ScoreBar
