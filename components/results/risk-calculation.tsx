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
import TooltipWrapper, { Tooltip } from '../tooltip'

const TableCell = ({
  value,
  operator,
  unit,
  lowValue,
  expanded,
  setExpanded,
}: {
  value: number | null
  expanded: boolean
  setExpanded: (v: boolean) => void
  operator?: string
  tooltip: string
  unit?: string
  lowValue?: boolean
}) => {
  return (
    <Box sx={{ position: 'relative' }}>
      <Flex
        sx={{
          justifyContent: 'flex-start',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <ValueBadge
          value={value}
          unit={unit}
          lowValue={lowValue}
          sx={{ flexShrink: 0 }}
        />
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
  rps: 'This is the value from which the risk score is directly derived, which represents the expected risk of loss experienced per year for a generic structure.',
  bp: 'Annual burn probability (BP) for present day (circa 2011) and future (circa 2047) climates based upon landscape conditions circa 2020.',
  crps: 'Conditional net value change in a generic structure if it were to burn.',
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
  const isLowBp = bp === 0 && !!risk && risk > 0

  const tooltip = expanded ? TOOLTIP[expanded] : null

  return (
    <>
      <TooltipWrapper
        tooltip='Risk scores are based on an estimation of damage likelihood due to
        wildfire.'
        sx={{ justifyContent: 'flex-start', gap: 2, alignItems: 'baseline' }}
        buttonSx={{ position: 'relative', top: '1px' }}
        tooltipSx={{ mt: -1, mb: 3 }}
      >
        <Box variant='sectionHeading'>Calculating risk score</Box>
      </TooltipWrapper>

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
            tooltip='This is the value from which the risk score is directly derived.'
            operator='='
          />
        </Column>
        <Column start={2} width={1}>
          <TableCell
            key='bp'
            expanded={expanded === 'bp'}
            setExpanded={(value: boolean) => setExpanded(value ? 'bp' : null)}
            value={risk}
            tooltip='This is the value from which the risk score is directly derived.'
            operator='x'
            lowValue={isLowBp}
          />
        </Column>
        <Column start={3} width={1}>
          <TableCell
            key='crps'
            expanded={expanded === 'crps'}
            setExpanded={(value: boolean) => setExpanded(value ? 'crps' : null)}
            value={conditionalRisk}
            tooltip='This is the value from which the risk score is directly derived.'
            unit='#'
          />
        </Column>
        <Column
          start={1}
          width={3}
          sx={{ mt: 2, fontSize: [1, 1, 1, 2], color: 'secondary' }}
        >
          <AnimateHeight
            duration={100}
            height={expanded ? 'auto' : 0}
            easing={'linear'}
          >
            {tooltip}
          </AnimateHeight>
        </Column>
      </Row>
    </>
  )
}

export default RiskCalculation
