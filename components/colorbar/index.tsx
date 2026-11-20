import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Grid, ThemeUIStyleObject } from 'theme-ui'
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
import { HazardMapLayer } from '@/lib/hazards/types'
import ScoreBar from '../score-bar'
import ValueBadge from '../value-badge'
import { useStore } from '@/lib/store'

// vertical space reserved below the colorbar for tick marks, boundary values,
// and a second row for the string bin labels and axis label
const TICKS_HEIGHT = 56
const BIN_LABEL_OFFSET = 28
const CONTINUOUS_TICKS_HEIGHT = 40

// a ScoreBar cell: 1 of 11 across 10 2px gaps
const NARROW_CELL = 'calc((100% - 20px) / 11)'
const narrowCellWidth = (width: number) => (width - 20) / 11

const BinBadges = ({
  layer,
  ramp,
}: {
  layer: HazardMapLayer
  ramp: string[]
}) => {
  const {
    binBoundaries,
    binLabels = [],
    binShortLabels,
    minorBins = [],
  } = layer
  const colormap = ramp.slice(1)
  const categorical = !!layer.categorical
  const zeroCell = !categorical && binBoundaries[0] === 0
  const lastEdge = binBoundaries.length - 1
  const binCount = binBoundaries.length
  const cellCount = binCount + (zeroCell ? 1 : 0)
  const majorCount = binCount - minorBins.length

  const gridRef = useRef<HTMLDivElement>(null)
  const fullRef = useRef<HTMLDivElement>(null)
  const majorRef = useRef<HTMLDivElement>(null)
  const shortRef = useRef<HTMLDivElement>(null)
  // 'full': every name; 'compact': minor names dropped and their badges
  // narrowed; 'short': compact, with the remaining names abbreviated
  const [fit, setFit] = useState<'full' | 'compact' | 'short'>('full')

  const longest = (labels: string[]) =>
    labels.reduce((a, b) => (b.length > a.length ? b : a), '')
  const isMajor = (_: unknown, i: number) => !minorBins.includes(i)
  const longestLabel = longest(binLabels)
  const longestMajor = longest(binLabels.filter(isMajor))
  const longestShort = longest((binShortLabels ?? []).filter(isMajor))

  // compares the widest names' badges against a bin's share of each layout in
  // turn, independent of the layout showing, so the choice doesn't oscillate
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const canCompact = minorBins.length > 0 && majorCount > 0
    const canShorten = canCompact && !!binShortLabels
    if (!canCompact) return
    const update = () => {
      const width = grid.clientWidth
      const narrow = narrowCellWidth(width)
      const gaps = 2 * (cellCount - 1)
      const zeroWidth = zeroCell ? narrow : 0
      const perBin = (width - zeroWidth - gaps) / binCount
      const perMajor =
        (width - zeroWidth - minorBins.length * narrow - gaps) / majorCount
      const fits = (ref: React.RefObject<HTMLDivElement>, space: number) =>
        (ref.current?.offsetWidth ?? 0) <= space
      if (fits(fullRef, perBin)) setFit('full')
      else if (!canShorten || fits(majorRef, perMajor)) setFit('compact')
      else setFit('short')
    }
    update()
    // the badge's font size changes at breakpoints as well as the bar's width
    const observer = new ResizeObserver(update)
    observer.observe(grid)
    for (const ref of [fullRef, majorRef, shortRef]) {
      if (ref.current) observer.observe(ref.current)
    }
    return () => observer.disconnect()
  }, [
    minorBins.length,
    binShortLabels,
    majorCount,
    zeroCell,
    cellCount,
    binCount,
    longestLabel,
    longestMajor,
    longestShort,
  ])

  const cells = [
    ...(zeroCell
      ? [{ color: ramp[0], label: '0', edge: null, muted: true, narrow: true }]
      : []),
    ...binBoundaries.map((boundary, i) => {
      const dropped = fit !== 'full' && minorBins.includes(i)
      const label =
        fit === 'short' ? (binShortLabels?.[i] ?? binLabels[i]) : binLabels[i]
      return {
        color: colormap[i],
        label: dropped ? '' : (label ?? ''),
        edge:
          categorical || (zeroCell && i === 0)
            ? null
            : `${boundary}${i === lastEdge ? '+' : ''}`,
        muted: false,
        narrow: dropped,
      }
    }),
  ]
  const columns = cells
    .map(({ narrow }) => (narrow ? NARROW_CELL : '1fr'))
    .join(' ')

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        {[
          [fullRef, longestLabel],
          [majorRef, longestMajor],
          [shortRef, longestShort],
        ].map(([ref, label], i) => (
          <Box
            key={i}
            ref={ref as React.RefObject<HTMLDivElement>}
            aria-hidden='true'
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              visibility: 'hidden',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <ValueBadge value={label as string} unit='#' whitespace={false} />
          </Box>
        ))}
        <Grid
          ref={gridRef}
          role='img'
          aria-label={`${layer.axisLabel ?? ''} scale`}
          sx={{
            gridTemplateColumns: columns,
            gridGap: '2px',
            width: '100%',
          }}
        >
          {cells.map(({ color, label, edge, muted }, i) => (
            <Flex key={i} sx={{ position: 'relative' }}>
              {edge !== null && (
                <>
                  <Box
                    sx={{
                      position: 'absolute',
                      height: '5px',
                      bottom: '-12px',
                      left: i === 0 ? 0 : '-1.5px',
                      color: 'secondary',
                      borderStyle: 'solid',
                      borderWidth: '0px',
                      borderLeftWidth: '1px',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: ['-28px', '-28px', '-28px', '-31px'],
                      left: i === 0 ? 0 : '-1px',
                      // the bar's leading edge keeps its label inside the bar
                      transform: i === 0 ? 'none' : 'translateX(-50%)',
                      fontSize: [0, 0, 0, 1],
                      fontFamily: 'mono',
                      letterSpacing: 'mono',
                      color: 'secondary',
                      userSelect: 'none',
                    }}
                  >
                    {edge}
                  </Box>
                </>
              )}
              <ValueBadge
                value={label}
                unit='#'
                color={color}
                whitespace={false}
                sx={{
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  ...(muted && { color: 'secondary' }),
                }}
              />
            </Flex>
          ))}
        </Grid>
      </Box>
      <Box sx={{ width: '100%', mt: categorical ? 3 : '50px', pb: 1 }}>
        <Chart x={[0, 1]} y={[0, 1]}>
          <AxisLabel
            bottom
            units={layer.unit}
            sx={{
              color: 'secondary',
              '& svg': { fill: 'secondary' },
            }}
          >
            {layer.axisLabel}
          </AxisLabel>
        </Chart>
      </Box>
    </>
  )
}

const Colorbar = ({ sx }: { sx?: ThemeUIStyleObject }) => {
  const riskConfig = useStore((state) => state.riskConfig)
  const mapLayer = useStore((state) => state.mapLayer)
  const activeLayer = getMapLayer(riskConfig, mapLayer)
  const binBoundaries = activeLayer?.binBoundaries ?? []
  const binLabels = activeLayer?.binLabels ?? []
  // the same samples the raster paints with, minus its leading no-data swatch,
  // so the bar describes the map rather than an independent sampling of the ramp
  const ramp = useColormap({
    count: activeLayer?.continuous ? 255 : binBoundaries.length,
  })
  const colormap = ramp.slice(1)

  let content = <ScoreBar labels />
  if (activeLayer?.continuous) {
    const bounds = [
      activeLayer.binBoundaries[0],
      activeLayer.binBoundaries[activeLayer.binBoundaries.length - 1],
    ]
    content = (
      <Flex sx={{ flexDirection: 'column' }}>
        <ColorbarBase
          colormap={colormap}
          horizontal
          width={'100%'}
          height={[21, 21, 21, 22]}
        />
        <Box sx={{ width: '100%', height: `${CONTINUOUS_TICKS_HEIGHT}px` }}>
          <Chart
            x={bounds}
            y={[0, 0]}
            padding={{ left: 0, right: 0, bottom: CONTINUOUS_TICKS_HEIGHT }}
          >
            <Ticks bottom values={bounds} />
            <TickLabels
              bottom
              values={bounds}
              sx={{
                // keep the end labels inside the bar
                ':first-of-type': { transform: 'none' },
                ':last-of-type': { transform: 'translateX(-100%)' },
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
      </Flex>
    )
  } else if (activeLayer?.binBadges) {
    content = <BinBadges layer={activeLayer} ramp={ramp} />
  } else if (activeLayer?.customColormap) {
    const binCount = binBoundaries.length
    // one tick per bin edge, the last bin open-ended; classes have no edges
    // worth labelling
    const boundaryTicks = activeLayer.categorical
      ? []
      : binBoundaries.map((_, i) => i)
    content = (
      <Flex sx={{ flexDirection: 'column' }}>
        <ColorbarBase
          colormap={colormap}
          horizontal
          discrete
          width={'100%'}
          height={[21, 21, 21, 22]}
        />
        {/* bins are evenly spaced across the colorbar, so the chart is scaled
            in bin index space: boundary values sit on bin edges and the string
            labels are centered within their bin */}
        <Box sx={{ width: '100%', height: `${TICKS_HEIGHT}px` }}>
          <Chart
            x={[0, binCount]}
            y={[0, 0]}
            padding={{ left: 0, right: 0, bottom: TICKS_HEIGHT }}
          >
            <Ticks bottom values={boundaryTicks} />
            <TickLabels
              bottom
              values={boundaryTicks}
              format={(d: number) => binBoundaries[d]}
            />
            {binLabels.length > 0 && (
              <TickLabels
                bottom
                values={binLabels.map((_, i) => i + 0.5)}
                labels={binLabels}
                padding={BIN_LABEL_OFFSET}
                sx={{
                  width: `${100 / binCount}%`,
                  textAlign: 'center',
                  lineHeight: 0.5,
                  color: 'primary',
                  textTransform: 'uppercase',
                }}
              />
            )}
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
  return <Box sx={{ mt: 3, ...sx }}>{content}</Box>
}

export default Colorbar
