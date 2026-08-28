import { Box, Flex } from 'theme-ui'
import {
  Chart,
  AxisLabel,
  Ticks,
  TickLabels,
  //@ts-expect-error - carbonplan charts types not available
} from '@carbonplan/charts'

import {
  Colorbar as ColorbarBase,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

import { useColormap } from '@/lib/colormaps'
import { getMapLayer } from '@/lib/hazards'
import ScoreBar from '../score-bar'
import { useStore } from '@/lib/store'

// vertical space reserved below the colorbar for tick marks, boundary values,
// and the string bin labels
const TICKS_HEIGHT = 56
const BIN_LABEL_OFFSET = 28

const Colorbar = () => {
  const riskConfig = useStore((state) => state.riskConfig)
  const mapLayer = useStore((state) => state.mapLayer)
  const activeLayer = getMapLayer(riskConfig, mapLayer)
  const binLabels = activeLayer?.binLabels ?? []
  // the same samples the raster paints with, minus its leading no-data swatch,
  // so the bar describes the map rather than an independent sampling of the ramp
  const colormap = useColormap({
    count: binLabels.length > 0 ? binLabels.length : 255,
  }).slice(1)

  let content = <ScoreBar labels />
  if (activeLayer?.customColormap) {
    const binBoundaries = activeLayer.binBoundaries
    const discrete = binLabels.length > 0
    // one tick per bin edge, indexed into binBoundaries by bin
    const boundaryTicks = (binBoundaries ?? [])
      .slice(0, binLabels.length + 1)
      .map((_, i) => i)
    content = (
      <Flex sx={{ flexDirection: 'column' }}>
        <ColorbarBase
          colormap={colormap}
          horizontal
          discrete={discrete}
          width={'100%'}
          height={[21, 21, 21, 22]}
          clim={
            !discrete && binBoundaries
              ? [binBoundaries[0], binBoundaries[1]]
              : undefined
          }
        />
        {discrete && (
          // bins are evenly spaced across the colorbar, so the chart is scaled
          // in bin index space: boundary values sit on bin edges and the string
          // labels are centered within their bin
          <Box sx={{ width: '100%', height: `${TICKS_HEIGHT}px` }}>
            <Chart
              x={[0, binLabels.length]}
              y={[0, 0]}
              padding={{ left: 0, right: 0, bottom: TICKS_HEIGHT }}
            >
              <Ticks bottom values={boundaryTicks} />
              <TickLabels
                bottom
                values={boundaryTicks}
                format={(d: number) => binBoundaries?.[d]}
              />
              <TickLabels
                bottom
                values={binLabels.map((_, i) => i + 0.5)}
                labels={binLabels}
                padding={BIN_LABEL_OFFSET}
                sx={{
                  width: `${100 / binLabels.length}%`,
                  textAlign: 'center',
                  lineHeight: 0.5,
                  color: 'primary',
                  textTransform: 'uppercase',
                }}
              />
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
        )}
      </Flex>
    )
  }
  return <Box sx={{ mt: 3 }}>{content}</Box>
}

export default Colorbar
