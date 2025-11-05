import { Box } from 'theme-ui'
import {
  Table,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
  getRiskScore,
} from '@/lib/risk-utils'
import ValueBadge from './value-badge'
import TooltipWrapper from '../tooltip'

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
  const isLowBp = bp === 0 && !!risk && risk > 0

  return (
    <>
      <TooltipWrapper
        tooltip='Risk scores are based on an estimation of damage likelihood due to
        wildfire.'
        sx={{ justifyContent: 'flex-start', gap: 3, alignItems: 'baseline' }}
      >
        <Box variant='sectionHeading'>Calculating risk</Box>
      </TooltipWrapper>

      <Table
        columns={3}
        start={[1, 2, 3]}
        width={[1, 1, 1]}
        data={[
          [
            <Box key='rol' sx={{ whiteSpace: 'nowrap' }}>
              Risk{' '}
              <Box
                as='br'
                sx={{ display: ['block', 'block', 'block', 'none'] }}
              />{' '}
              of loss
            </Box>,
            <Box key='bp' sx={{ whiteSpace: 'nowrap' }}>
              Burn
              <Box
                as='br'
                sx={{ display: ['block', 'block', 'block', 'none'] }}
              />{' '}
              probability
            </Box>,
            <Box key='cr' sx={{ whiteSpace: 'nowrap' }}>
              Conditional
              <Box
                as='br'
                sx={{ display: ['block', 'block', 'block', 'none'] }}
              />{' '}
              risk
            </Box>,
          ],
          [
            <Box key='rol' sx={{ position: 'relative' }}>
              <ValueBadge value={risk} />
              <Box
                sx={{
                  position: 'absolute',
                  left: ['80%', '60%', '75%', '70%'],
                  top: '50%',
                  transform: 'translate(50%, -50%)',
                }}
              >
                =
              </Box>
            </Box>,
            <Box key='bp' sx={{ position: 'relative' }}>
              <ValueBadge value={bp} lowValue={isLowBp} />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: ['80%', '60%', '75%', '70%'],
                  transform: 'translate(50%, -50%)',
                }}
              >
                x
              </Box>
            </Box>,
            <ValueBadge key='cr' value={conditionalRisk} unit='#' />,
          ],
        ]}
        borderTop={false}
        index={false}
        sx={{
          mt: 2,
          '& tr:first-of-type td': {
            fontSize: 1,
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            color: 'secondary',
          },
          '& tr:first-of-type': {
            py: 1,
          },
          '& tr:last-of-type': {
            py: 2,
          },
        }}
      />
    </>
  )
}

export default RiskCalculation
