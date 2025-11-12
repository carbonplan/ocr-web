import { Box, Flex } from 'theme-ui'
import {
  Column,
  Row,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
  getRiskScore,
} from '@/lib/risk-utils'
import { useState } from 'react'
import AnimateHeight from 'react-animate-height'

import { useStore } from '@/lib/store'
import ValueBadge from './value-badge'
import { Tooltip } from '../tooltip'

const TableCell = ({
  value,
  operator,
  unit,
  lowValue,
  expanded,
  toFixed,
  setExpanded,
}: {
  value: number | null
  expanded: boolean
  setExpanded: (v: boolean) => void
  operator?: string
  unit?: string
  toFixed?: number
  lowValue?: boolean
}) => {
  return (
    <Box sx={{ position: 'relative', mb: '2px' }}>
      <Flex
        sx={{
          justifyContent: 'flex-start',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Box>
          <ValueBadge
            value={value}
            unit={unit}
            lowValue={lowValue}
            toFixed={toFixed}
            sx={{ flexShrink: 0 }}
          />
        </Box>
        <Tooltip
          expanded={expanded}
          setExpanded={setExpanded}
          sx={{ mb: '-4px' }}
        />
      </Flex>
      {operator && (
        <Box
          sx={{
            position: 'absolute',
            left: ['80%', '60%', '75%', '70%'],
            top: '10px',
            transform: 'translate(125%, -50%)',
          }}
        >
          {operator}
        </Box>
      )}
    </Box>
  )
}

const TOOLTIP = {
  rps: 'Annual risk of loss incorporates both the probability and relative severity of fire at a given location. This value is directly translated into the risk score.',
  bp: {
    current:
      'Annual burn probability (BP) for today’s climate (circa 2011) based on fire weather wind direction and landscape conditions.',
    future:
      'Annual burn probability (BP) for future climate (circa 2047) based on fire weather wind direction and landscape conditions.',
  },
  crps: 'Relative net value change in a hypothetical generic structure if a fire occurred at this location. This value reflects fire severity and is controlled by the local landscape.',
}

const sx = {
  tableHead: {
    fontSize: 1,
    fontFamily: 'mono',
    letterSpacing: 'mono',
    textTransform: 'uppercase' as const,
    color: 'secondary',
    whiteSpace: 'nowrap',
  },
  row: {
    borderStyle: 'solid',
    borderWidth: '0px',
    borderBottomWidth: '1px',
    borderColor: 'muted',
    mb: ['2px'],
  },
}

const RiskCalculation = () => {
  const [expanded, setExpanded] = useState<'rps' | 'bp' | 'crps' | null>(null)
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
  const isLowBp = bp ? bp < 0.01 : false
  const isLowRisk = risk ? risk < 0.01 : false
  const isLowConditionalRisk = conditionalRisk ? conditionalRisk < 0.01 : false

  let tooltip
  if (expanded) {
    tooltip =
      expanded === 'bp' ? TOOLTIP[expanded][timePeriod] : TOOLTIP[expanded]
  }

  return (
    <>
      <Box sx={{ mt: 2 }}>
        Risk scores are calculated from percentile-based bins of annual risk of
        loss, which is computed at every building location with the following
        equation:
      </Box>

      <Row columns={3} sx={{ ...sx.row, mt: 2, py: 1 }}>
        <Column start={1} width={1}>
          <Box key='rps' sx={sx.tableHead}>
            Risk{' '}
            <Box
              as='br'
              sx={{ display: ['block', 'block', 'block', 'none'] }}
            />{' '}
            of loss
          </Box>
        </Column>
        <Column start={2} width={1}>
          <Box key='bp' sx={sx.tableHead}>
            Burn
            <Box
              as='br'
              sx={{ display: ['block', 'block', 'block', 'none'] }}
            />{' '}
            probability
          </Box>
        </Column>
        <Column start={3} width={1}>
          <Box key='bp' sx={sx.tableHead}>
            Conditional
            <Box
              as='br'
              sx={{ display: ['block', 'block', 'block', 'none'] }}
            />{' '}
            risk
          </Box>
        </Column>
      </Row>
      <Row columns={3} sx={{ ...sx.row, py: 2 }}>
        <Column start={1} width={1}>
          <TableCell
            key='rps'
            expanded={expanded === 'rps'}
            setExpanded={(value: boolean) => setExpanded(value ? 'rps' : null)}
            value={risk}
            operator='='
            lowValue={isLowRisk}
          />
        </Column>
        <Column start={2} width={1}>
          <TableCell
            key='bp'
            expanded={expanded === 'bp'}
            setExpanded={(value: boolean) => setExpanded(value ? 'bp' : null)}
            value={bp}
            operator='x'
            unit='#'
            toFixed={3}
            lowValue={isLowBp}
          />
        </Column>
        <Column start={3} width={1}>
          <TableCell
            key='crps'
            expanded={expanded === 'crps'}
            setExpanded={(value: boolean) => setExpanded(value ? 'crps' : null)}
            value={conditionalRisk}
            unit='%'
            toFixed={1}
            lowValue={isLowConditionalRisk}
          />
        </Column>
        <Column
          start={1}
          width={3}
          sx={{ fontSize: [1, 1, 1, 2], color: 'secondary' }}
        >
          <AnimateHeight
            duration={100}
            height={expanded ? 'auto' : 0}
            easing={'linear'}
          >
            <Box sx={{ pt: 2 }}>{tooltip}</Box>
          </AnimateHeight>
        </Column>
      </Row>
    </>
  )
}

export default RiskCalculation
