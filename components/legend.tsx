//@ts-expect-error - carbonplan components types not available
import { Colorbar, Column, Row, Filter, Input } from '@carbonplan/components'
//@ts-expect-error - carbonplan charts types not available
import { Chart, TickLabels } from '@carbonplan/charts'
import { useLocationStore } from '../store/location'
import { calculateBinBoundaries, useColormap } from '../lib/colormaps'
import { Flex } from 'theme-ui'

const evenlySpacedTicks = [0, 1, 2, 3, 4]

const Legend = () => {
  const currentRiskConfig = useLocationStore((state) => state.currentRiskConfig)
  const currentColorLimits = useLocationStore(
    (state) => state.currentColorLimits,
  )

  const setCurrentColorLimits = useLocationStore(
    (state) => state.setCurrentColorLimits,
  )
  const colormap = useColormap(currentRiskConfig.colormap, {
    count: currentColorLimits.type === 'discrete' ? 5 : 256,
  })

  const discreteClim =
    currentColorLimits.type === 'discrete'
      ? calculateBinBoundaries(
          currentColorLimits.bounds,
          currentRiskConfig.binRatios,
        )
      : null

  const formatTickValue = (d: number) => {
    return `${d.toFixed(0)}%`
  }

  const formatDiscreteTickValue = (d: number) => {
    if (!discreteClim || d < 0 || d >= discreteClim.length) {
      return d
    }
    const formattedValue = formatTickValue(discreteClim[d])
    return d === evenlySpacedTicks?.[evenlySpacedTicks.length - 1]
      ? `${formattedValue}+`
      : `${formattedValue}`
  }

  const chartXRange =
    currentColorLimits.type === 'discrete' ? [0, 5] : currentColorLimits.bounds

  return (
    <>
      <Row variant='labelFieldContainer' columns={4}>
        <Column start={1} width={1} variant='label'>
          Legend
        </Column>
        <Column start={2} width={3}>
          <Flex
            sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}
          >
            <Filter
              values={{
                continuous: currentColorLimits.type === 'continuous',
                discrete: currentColorLimits.type === 'discrete',
              }}
              setValues={(values: Record<string, boolean>) => {
                const selectedType = Object.keys(values).find(
                  (key) => values[key],
                )
                if (
                  selectedType &&
                  (selectedType === 'discrete' || selectedType === 'continuous')
                ) {
                  setCurrentColorLimits({
                    type: selectedType as 'discrete' | 'continuous',
                    bounds: currentColorLimits.bounds,
                  })
                }
              }}
            />
            <Flex sx={{ alignItems: 'center', gap: 1 }}>
              0 -
              <Input
                size='xs'
                type='number'
                min={1}
                max={100}
                step={10}
                sx={{
                  width: 45,
                  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                    { opacity: 1 },
                }}
                value={currentColorLimits.bounds[1]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseFloat(e.target.value)
                  setCurrentColorLimits({
                    type: currentColorLimits.type,
                    bounds: [0, value],
                  })
                }}
              />
            </Flex>
          </Flex>
        </Column>
      </Row>
      <Colorbar
        colormap={colormap}
        discrete={currentColorLimits.type === 'discrete'}
        horizontal
        width={'100%'}
      />
      <Chart x={chartXRange} y={[0, 0]} padding={{ left: 1, bottom: 8 }}>
        <TickLabels
          bottom
          values={
            currentColorLimits.type === 'discrete' ? evenlySpacedTicks : null
          }
          format={
            currentColorLimits.type === 'discrete'
              ? formatDiscreteTickValue
              : formatTickValue
          }
          sx={{
            ml: discreteClim ? 1 : 0,
            width: discreteClim ? 10 : 'auto',
          }}
        />
      </Chart>
    </>
  )
}
export default Legend
