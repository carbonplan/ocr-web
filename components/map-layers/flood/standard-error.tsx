import { Box, useThemeUI } from 'theme-ui'
import { alpha } from '@theme-ui/color'
import { useStore } from '@/lib/store'
import { getMapLayer, toDisplayUnits } from '@/lib/hazards'
import { getContinuousColor, useColormap } from '@/lib/colormaps'
import { FdpPointQuery } from '@/hooks/useFdpPoint'
import ScoreBar from '../../score-bar'
import ValueBadge from '../../value-badge'

// the probability's upper bound, in display %, which ends the last bin
const MAX = 100

// the narrowest the standard error bracket draws, so a small one stays visible
const MIN_BRACKET = '6px'

// A value's position across the score bar, as a percentage of its width:
// cell 0 is the "0" score, and cell k + 1 spans bins[k] to bins[k + 1]. Off by
// up to the bar's 2px cell gaps, which don't scale with it.
const toPosition = (bins: number[], value: number) => {
  const k = Math.max(
    0,
    bins.findLastIndex((lo) => value >= lo),
  )
  const lo = bins[k]
  const hi = bins[k + 1] ?? MAX
  const within = Math.min(1, Math.max(0, (value - lo) / (hi - lo)))
  return ((1 + k + within) / (bins.length + 1)) * 100
}

// The probability on its score bar, with a bracket one standard error to
// either side, clipped to the bar
const StandardError = ({ point }: { point: FdpPointQuery }) => {
  const riskConfig = useStore((state) => state.riskConfig)
  const { theme } = useThemeUI()
  // each layer's own scale, whichever layer the map shows
  const fdpLayer = getMapLayer(riskConfig, 'fdp')
  const fdpBins = fdpLayer?.binBoundaries ?? riskConfig.binBoundaries
  const fdpColormap = useColormap({
    name: fdpLayer?.colormap ?? riskConfig.colormap,
    count: fdpBins.length,
  })
  const seLayer = getMapLayer(riskConfig, 'fdp_se')
  const seColormap = useColormap({ name: seLayer?.colormap, continuous: true })
  if (point.status !== 'success') return null
  const p = toDisplayUnits(riskConfig, 'fdp', point.data.fdp)
  const se = toDisplayUnits(riskConfig, 'fdp_se', point.data.fdpSe)
  if (p === null || se === null) return null
  const seBins = seLayer?.binBoundaries
  const seColor = seBins
    ? getContinuousColor(seColormap, [seBins[0], seBins[seBins.length - 1]], se)
    : undefined

  const center = toPosition(fdpBins, p)
  const lower = toPosition(fdpBins, Math.max(0, p - se))
  const upper = toPosition(fdpBins, Math.min(MAX, p + se))

  return (
    <>
      <Box>
        How much the probability here typically moves when the model is refit on
        a resample of the same flood reports. This understates the real
        uncertainty: it leaves out new reports, the choice of no-damage points,
        and errors in the model itself.
      </Box>
      <Box sx={{ mt: 3 }}>
        The flood damage probability at this location is{' '}
        <ValueBadge value={p} toFixed={1} />
        , give or take <ValueBadge value={se} toFixed={1} />.
        <ScoreBar
          labels
          bins={fdpBins}
          colormap={fdpColormap}
          value={p}
          sx={{ mt: 3 }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '-3px',
              bottom: '-8px',
              left: `${(lower + upper) / 2}%`,
              width: `max(${upper - lower}%, ${MIN_BRACKET})`,
              transform: 'translateX(-50%)',
              bg: alpha('primary', 0.3)(theme),
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '-3px',
              bottom: '-12px',
              left: `${center}%`,
              width: '2px',
              transform: 'translateX(-50%)',
              bg: 'primary',
            }}
          />
        </ScoreBar>
      </Box>
    </>
  )
}

export default StandardError
