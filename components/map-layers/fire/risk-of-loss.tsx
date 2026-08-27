import { Box } from 'theme-ui'
import { useStore } from '@/lib/store'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
  getRiskScore,
} from '@/lib/risk-utils'
import TooltipTable from '../../results/tooltip-table'
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
  horizons: {
    1: 'Risk of loss in a single year (equal to above).',
    15: 'Risk of loss in any year over a 15-year time horizon.',
    30: 'Risk of loss in any year over a 30-year time horizon.',
  },
  calculation: {
    rps: 'Annual risk of loss incorporates both the probability and relative consequence of wildfire to a structure at a given location. Also known as the expected annual net value change. This value is directly translated into the risk score. Values range from 0 to 100.',
    bp: {
      current:
        'Annual burn probability (BP) for current climate (circa 2011). Determined by modeled wildfire frequency, adjusted by fire-weather wind directions. Values range from 0 to 1.',
      future:
        'Annual burn probability (BP) for future climate (circa 2047). Determined by modeled wildfire frequency, adjusted by fire-weather wind directions. Values range from 0 to 1.',
    },
    crps: 'Relative loss in structure value if a wildfire were to occur at a given location. Determined by the modeled intensity of a fire at this location and is largely controlled by local vegetation. Values range from 0 to 100.',
  },
}

const TimeHorizons = () => {
  const risk = useStore((state) =>
    getRiskScore(state.selectedBuilding, state.timePeriod),
  )
  const bp = useStore((state) =>
    getAdjustedBurnProbability(state.selectedBuilding, state.timePeriod),
  )
  const conditionalRisk = useStore((state) =>
    getConditionalRiskUsfs(state.selectedBuilding),
  )
  const timePeriod = useStore((state) => state.timePeriod)

  const horizonValues = useMemo(() => {
    return [1, 15, 30].map((horizon) => ({
      key: String(horizon),
      aria: `More information about ${horizon}-year time horizon`,
      label: `${horizon} ${horizon > 1 ? 'years' : 'year'}`,
      value: getRiskOverHorizon(horizon, bp, conditionalRisk),
    }))
  }, [bp, conditionalRisk])
  const calculationValues = [
    {
      key: 'rps',
      aria: 'More information about risk of loss',
      operator: '=',
      label: (
        <>
          Risk{' '}
          <Box
            as='br'
            aria-hidden='true'
            sx={{ display: ['block', 'block', 'block', 'none'] }}
          />{' '}
          of loss
        </>
      ),
      value: risk,
    },
    {
      key: 'bp',
      aria: 'More information about burn probability',
      operator: 'x',
      unit: '#',
      toFixed: 3,
      label: (
        <>
          Burn{' '}
          <Box
            as='br'
            aria-hidden='true'
            sx={{ display: ['block', 'block', 'block', 'none'] }}
          />{' '}
          probability
        </>
      ),
      value: bp,
    },
    {
      key: 'crps',
      aria: 'More information about conditional risk',
      toFixed: 1,
      label: (
        <>
          Conditional{' '}
          <Box
            as='br'
            aria-hidden='true'
            sx={{ display: ['block', 'block', 'block', 'none'] }}
          />{' '}
          risk
        </>
      ),
      value: conditionalRisk,
    },
  ]

  return (
    <>
      <Box>
        An annual value that represents the expected relative risk of loss in a
        given year, accounting for both the frequency and magnitude of a loss
        event. This value is calculated at every pixel with the following
        equation:
      </Box>

      <Box sx={{ variant: 'srOnly' }}>
        Risk of loss (%) equals burn probability (#) times conditional risk (%).
        Each component has an information button with additional details.
      </Box>

      <Box>
        <TooltipTable
          values={calculationValues}
          tooltips={{
            rps: TOOLTIPS.calculation.rps,
            bp: TOOLTIPS.calculation.bp[timePeriod],
            crps: TOOLTIPS.calculation.crps,
          }}
          tooltipId='risk-calculation-tooltip'
        />
      </Box>

      <Box sx={{ mt: 4, variant: 'description' }}>
        Over longer time horizons, the annual burn probability, and thus risk of
        loss, compounds.
      </Box>

      <TooltipTable
        tooltipId='time-horizon-tooltip'
        tooltips={TOOLTIPS.horizons}
        values={horizonValues}
      />
    </>
  )
}

export default TimeHorizons
