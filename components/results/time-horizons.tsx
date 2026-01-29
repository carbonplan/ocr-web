import { Box } from 'theme-ui'
import { useStore } from '@/lib/store'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
} from '@/lib/risk-utils'
import TooltipTable from './tooltip-table'
import { useMemo } from 'react'

const getProbabilityOverHorizon = (horizon: number, bp: number | null) =>
  typeof bp === 'number' ? 1 - Math.pow(1 - bp, horizon) : null

const getRiskOverHorizon = (
  horizon: number,
  bp: number | null,
  conditionalRisk: number | null,
) => {
  if (bp == null || conditionalRisk == null) {
    return null
  }

  return (getProbabilityOverHorizon(horizon, bp) ?? 0) * conditionalRisk
}

const TOOLTIPS = {
  1: 'Risk of loss in a single year (equal to above).',
  15: 'Risk of loss in any year over a 15 year time horizon.',
  30: 'Risk of loss in any year over a 30 year time horizon.',
}

const TimeHorizons = () => {
  const bp = useStore((state) =>
    getAdjustedBurnProbability(state.selectedBuilding, state.timePeriod),
  )
  const conditionalRisk = useStore((state) =>
    getConditionalRiskUsfs(state.selectedBuilding),
  )
  const values = useMemo(() => {
    return [1, 15, 30].map((horizon) => ({
      key: String(horizon),
      aria: `More information about ${horizon}-year time horizon`,
      label: `${horizon} ${horizon > 1 ? 'years' : 'year'}`,
      value: getRiskOverHorizon(horizon, bp, conditionalRisk),
    }))
  }, [bp, conditionalRisk])

  return (
    <>
      <Box sx={{ mt: 4 }}>
        Over longer time horizons, the annual burn probability and, thus risk of
        loss, compounds.
      </Box>

      <TooltipTable
        tooltipId='time-horizon-tooltip'
        tooltips={TOOLTIPS}
        values={values}
      />
    </>
  )
}

export default TimeHorizons
