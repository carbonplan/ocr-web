import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Colorbar, Filter, Input } from '@carbonplan/components'
//@ts-expect-error - carbonplan charts types not available
import { Chart, TickLabels } from '@carbonplan/charts'
import { useStore } from '../lib/store'
import { calculateBinBoundaries, useColormap } from '../lib/colormaps'

const evenlySpacedTicks = [0, 1, 2, 3, 4]

const Legend = () => {
  const riskConfig = useStore((state) => state.riskConfig)
  const colorLimits = useStore((state) => state.colorLimits)
  const setColorLimits = useStore((state) => state.setColorLimits)
  const advancedMode = useStore((state) => state.advancedMode)
  const isDiscrete = colorLimits.type === 'discrete'
  const baseColormap = useColormap(riskConfig.colormap, {
    count: isDiscrete ? 5 : 256,
  })
  const discreteClim = isDiscrete
    ? calculateBinBoundaries(colorLimits.bounds, riskConfig.binRatios)
    : null

  const formatPercentage = (value: number, isMax: boolean) => {
    return `${value.toFixed(0)}${isMax && value !== 100 ? '+' : ''}`
  }

  const formatTickValue = (d: number) => {
    if (isDiscrete) {
      const value = discreteClim![d]
      const isMax = value === discreteClim![discreteClim!.length - 1]
      return formatPercentage(value, isMax)
    } else {
      const isMax = d === colorLimits.bounds[1]
      return formatPercentage(d, isMax)
    }
  }

  const chartXRange = isDiscrete ? [0, 5] : [0, colorLimits.bounds[1]]

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
        <Flex sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
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
              })
            }}
          />
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
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
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
                })
              }}
            />
          </Flex>
        </Flex>
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
          values={isDiscrete ? evenlySpacedTicks : null}
          format={formatTickValue}
          sx={{
            color: 'primary',
            ml: discreteClim ? 2 : '-10px',
            width: discreteClim ? 10 : 'auto',
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
