import { Box } from 'theme-ui'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
  getRiskScore,
} from '@/lib/risk-utils'

import { useStore } from '@/lib/store'
import TooltipTable from './tooltip-table'

const TOOLTIP = {
  rps: 'Annual risk of loss incorporates both the probability and relative consequence of wildfire to a structure at a given location. Also known as the expected annual net value change. This value is directly translated into the risk score. Values range from 0 to 100.',
  bp: {
    current:
      'Annual burn probability (BP) for today’s climate (circa 2011) based on fire weather wind direction and landscape conditions. Values range from 0 to 1.',
    future:
      'Annual burn probability (BP) for future climate (circa 2047) based on fire weather wind direction and landscape conditions. Values range from 0 to 1.',
  },
  crps: 'Relative loss in structure value if a wildfire were to occur at a given location. Determined by the modeled intensity of a fire at this location and is largely controlled by local vegetation. Values range from 0 to 100.',
}

const RiskCalculation = () => {
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

  const values = [
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
      <Box sx={{ mt: 2 }}>
        The risk scoring system is a categorical classification of continuous
        values of annual risk of loss, which is computed at every location with
        the following equation:
      </Box>

      <Box sx={{ variant: 'srOnly' }}>
        Risk of loss (%) equals burn probability (#) times conditional risk (%).
        Each component has an information button with additional details.
      </Box>

      <Box>
        <TooltipTable
          values={values}
          tooltips={{
            rps: TOOLTIP.rps,
            bp: TOOLTIP.bp[timePeriod],
            crps: TOOLTIP.crps,
          }}
          tooltipId='risk-calculation-tooltip'
        />
      </Box>
    </>
  )
}

export default RiskCalculation
