import { useState, useEffect } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Colorbar, Filter, Input, Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan charts types not available
import { Chart, TickLabels } from '@carbonplan/charts'
import { useStore } from '../lib/store'
import { useColormap } from '../lib/colormaps'

const Legend = () => {
  const riskConfig = useStore((state) => state.riskConfig)
  const colorLimits = useStore((state) => state.colorLimits)
  const setColorLimits = useStore((state) => state.setColorLimits)
  const advancedMode = useStore((state) => state.advancedMode)
  const isDiscrete = colorLimits.type === 'discrete'
  const baseColormap = useColormap()
  const [boundariesInput, setBoundariesInput] = useState(
    colorLimits.binBoundaries.join(', '),
  )

  useEffect(() => {
    setBoundariesInput(colorLimits.binBoundaries.join(', '))
  }, [colorLimits.binBoundaries])

  if (!advancedMode) {
    return null
  }

  // Generate tick values for discrete mode - one for each boundary
  const discreteTicks = isDiscrete
    ? colorLimits.binBoundaries.map((_, i) => i)
    : null

  const formatPercentage = (value: number, isMax: boolean) => {
    return `${value}${isMax && value !== 100 ? '+' : ''}`
  }

  const formatTickValue = (d: number) => {
    if (isDiscrete) {
      const value = colorLimits.binBoundaries[d]
      const isMax = d === colorLimits.binBoundaries.length - 1
      return formatPercentage(value, isMax)
    } else {
      const isMax = d === colorLimits.bounds[1]
      return formatPercentage(d, isMax)
    }
  }

  const handleApplyBoundaries = () => {
    const parsed = boundariesInput
      .split(',')
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v) && v >= 0)

    if (parsed.length > 0) {
      setColorLimits({
        type: colorLimits.type,
        bounds: colorLimits.bounds,
        binBoundaries: parsed,
      })
    }
  }

  const chartXRange = isDiscrete
    ? [0, colorLimits.binBoundaries.length]
    : [0, colorLimits.bounds[1]]

  return (
    <Box
      sx={{
        position: 'absolute',
        right: [3, 4, 5, 6],
        bottom: ['unset', 'unset', 30, 30],
        top: [50, 50, 'unset', 'unset'],
        width: [200, 200, 340, 340],
      }}
    >
      {advancedMode ? (
        <Box>
          <Flex
            sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}
          >
            <Filter
              values={{
                continuous: !isDiscrete,
                discrete: isDiscrete,
              }}
              setValues={(values: Record<string, boolean>) => {
                const type = values.discrete ? 'discrete' : 'continuous'
                setColorLimits({
                  type,
                  bounds: colorLimits.bounds,
                  binBoundaries: colorLimits.binBoundaries,
                })
              }}
            />
            {!isDiscrete && (
              <Flex
                sx={{
                  alignItems: 'baseline',
                  gap: 1,
                  fontSize: [1, 1, 1, 2],
                  whiteSpace: 'nowrap',
                }}
              >
                0 -
                <Input
                  size='xs'
                  type='number'
                  min={0}
                  max={100}
                  step={10}
                  sx={{
                    fontSize: [1, 1, 1, 2],
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                      {
                        opacity: 1,
                      },
                  }}
                  value={colorLimits.bounds[1]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = parseFloat(e.target.value)
                    if (value < 1 || value > 100) return
                    setColorLimits({
                      type: colorLimits.type,
                      bounds: [riskConfig.bounds.min, value],
                      binBoundaries: colorLimits.binBoundaries,
                    })
                  }}
                />
              </Flex>
            )}
          </Flex>
          {isDiscrete && (
            <Flex
              sx={{
                my: 2,
                gap: 2,
              }}
            >
              <Input
                size='xs'
                value={boundariesInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBoundariesInput(e.target.value)
                }
                sx={{
                  flex: 1,
                  fontSize: [0, 0, 1, 1],
                }}
              />
              <Button size='xs' onClick={handleApplyBoundaries}>
                Apply
              </Button>
            </Flex>
          )}
        </Box>
      ) : (
        <Flex
          sx={{
            justifyContent: 'flex-end',
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            mb: 1,
            fontSize: [0, 0, 1, 2],
          }}
        >
          Risk of structure loss (%)
        </Flex>
      )}
      <Flex
        sx={{
          width: '100%',
          height: '16px',
        }}
      >
        <Box
          sx={{
            width: '2%',
            height: ['10px', '100%', '100%', '100%'],
            bg: 'muted',
            mt: '1px',
            border: '1px solid',
            borderColor: 'hinted',
            borderRight: 'none',
          }}
        />
        <Box sx={{ width: '98%', height: '100%' }}>
          <Colorbar
            colormap={baseColormap}
            discrete={isDiscrete}
            horizontal
            width={'100%'}
          />
        </Box>
      </Flex>
      <Chart x={chartXRange} y={[0, 0]} padding={{ left: 1, bottom: 8 }}>
        <TickLabels
          bottom
          values={isDiscrete ? discreteTicks : null}
          format={formatTickValue}
          sx={{
            color: 'primary',
            ml: isDiscrete ? 2 : '-10px',
            width: isDiscrete ? 10 : 'auto',
            ':first-of-type': {
              // nudge zero over
              ml: 1,
              width: 10,
            },
          }}
        />
      </Chart>
    </Box>
  )
}
export default Legend
