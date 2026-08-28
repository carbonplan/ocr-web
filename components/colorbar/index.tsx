import { Box, Flex } from 'theme-ui'
import {
  Chart,
  AxisLabel,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'

import {
  Colorbar as ColorbarBase,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
// @ts-expect-error - carbonplan colormaps types not available
import { useThemedColormap } from '@carbonplan/colormaps'

import { getMapLayer } from '@/lib/hazards'
import ScoreBar from '../score-bar'
import { useStore } from '@/lib/store'

const Colorbar = () => {
  const riskConfig = useStore((state) => state.riskConfig)
  const mapLayer = useStore((state) => state.mapLayer)
  const activeLayer = getMapLayer(riskConfig, mapLayer)
  const colormap = useThemedColormap(riskConfig.colormap, {
    count: activeLayer?.binLabels?.length ?? 255,
  })

  let content = <ScoreBar labels />
  if (activeLayer?.customColormap) {
    const discrete = !!activeLayer?.binLabels?.length
    content = (
      <Flex sx={{ flexDirection: 'column' }}>
        <ColorbarBase
          colormap={colormap}
          horizontal
          discrete={discrete}
          width={'100%'}
          height={[21, 21, 21, 22]}
          clim={
            !discrete && activeLayer?.binBoundaries
              ? [activeLayer.binBoundaries[0], activeLayer.binBoundaries[1]]
              : undefined
          }
        />
        {discrete && (
          <Flex sx={{ width: '100%', justifyContent: 'space-between' }}>
            {activeLayer?.binLabels?.map((label) => (
              <Box
                key={label}
                sx={{
                  fontSize: [0, 0, 0, 1],
                  fontFamily: 'mono',
                  letterSpacing: 'mono',
                }}
              >
                {label}
              </Box>
            ))}
          </Flex>
        )}
        <Box sx={{ width: '100%', mt: '20px', pb: 1 }}>
          <Chart x={[0, 1]} y={[0, 1]}>
            <AxisLabel
              bottom
              units={activeLayer.unit}
              sx={{
                color: 'secondary',
                '& svg': { fill: 'secondary' },
              }}
            >
              {activeLayer.axisLabel}
            </AxisLabel>
          </Chart>
        </Box>
      </Flex>
    )
  }
  return <Box sx={{ mt: 3 }}>{content}</Box>
}

export default Colorbar
