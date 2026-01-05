import { useState, useEffect } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Colorbar, Input, Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan charts types not available
import { Chart, TickLabels } from '@carbonplan/charts'
import { useStore } from '../lib/store'
import { useColormap } from '../lib/colormaps'

const Legend = () => {
  const colorLimits = useStore((state) => state.colorLimits)
  const setColorLimits = useStore((state) => state.setColorLimits)
  const advancedMode = useStore((state) => state.advancedMode)
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

  // Generate tick values - one for each boundary
  const ticks = colorLimits.binBoundaries.map((_, i) => i)

  const formatPercentage = (value: number, isMax: boolean) => {
    return `${value}${isMax && value !== 100 ? '+' : ''}`
  }

  const formatTickValue = (d: number) => {
    const value = colorLimits.binBoundaries[d]
    const isMax = d === colorLimits.binBoundaries.length - 1
    return formatPercentage(value, isMax)
  }

  const handleApplyBoundaries = () => {
    const parsed = boundariesInput
      .split(',')
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v) && v >= 0)

    if (parsed.length > 0) {
      setColorLimits({
        bounds: colorLimits.bounds,
        binBoundaries: parsed,
      })
    }
  }

  const chartXRange = [0, colorLimits.binBoundaries.length]

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
            discrete
            horizontal
            width={'100%'}
          />
        </Box>
      </Flex>
      <Chart x={chartXRange} y={[0, 0]} padding={{ left: 1, bottom: 8 }}>
        <TickLabels
          bottom
          values={ticks}
          format={formatTickValue}
          sx={{
            color: 'primary',
            ml: 2,
            width: 10,
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
