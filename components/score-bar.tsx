import { ReactNode } from 'react'
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

// The cell a value falls in: 0 for exactly 0, else its bin's, offset by one
const getCell = (bins: number[], value: number) => {
  if (value === 0) return 0
  const bin = bins.findIndex(
    (lo, i) => value >= lo && (i === bins.length - 1 || value < bins[i + 1]),
  )
  return bin === -1 ? bins.length : bin + 1
}

// Follows the displayed layer unless given `bins`, a `colormap` sized to them
// and the `value` to highlight; `children` overlay the cells
const ScoreBar = ({
  labels,
  sx,
  bins: binsOverride,
  colormap: colormapOverride,
  value: valueOverride,
  children,
}: {
  labels?: boolean
  sx?: ThemeUIStyleObject
  bins?: number[]
  colormap?: string[]
  value?: number | null
  children?: ReactNode
}) => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const displayBins = useStore(
    useShallow((state) => state.colorLimits.binBoundaries),
  )
  const axisLabel = useStore((state) => state.riskConfig.axisLabel)
  const valueDisplay = useStore((state) => state.riskConfig.valueDisplay)
  const displayColormap = useColormap()
  const bins = binsOverride ?? displayBins
  const colormap = colormapOverride ?? displayColormap

  const scored = useScore(selectedBuilding, 'muted')
  const cell =
    valueOverride == null ? null : getCell(binsOverride ?? [], valueOverride)
  const { score, value, color } = binsOverride
    ? {
        score: cell === null ? null : String(cell),
        value: valueOverride ?? null,
        color: cell === null ? 'muted' : colormap[cell],
      }
    : scored

  let selectionLabel = ''
  if (score && valueDisplay) {
    selectionLabel = `, selection reads ${valueDisplay.format(value!)}`
  } else if (score) {
    selectionLabel = `, selected building has risk score ${score} (${bins[Number(score) - 1]}% to ${bins[Number(score)]}%)`
  }

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
            position: 'relative',
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
                  whitespace={false}
                  sx={{
                    width: '100%',
                    ...(i === 0 && score !== '0' ? { color: 'secondary' } : {}),
                  }}
                />
              </Flex>
            ))}
          {children}
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
