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
import { useState, useEffect, useRef } from 'react'
import AnimateHeight from 'react-animate-height'

import { useStore } from '@/lib/store'
import ValueBadge from './value-badge'
import { Tooltip } from '../tooltip'

const TableCell = ({
  value,
  operator,
  unit,
  expanded,
  toFixed,
  setExpanded,
  tooltipId,
  'aria-label': ariaLabel,
}: {
  value: number | null
  expanded: boolean
  setExpanded: (v: boolean) => void
  operator?: string
  unit?: string
  toFixed?: number
  tooltipId?: string
  'aria-label'?: string
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
            toFixed={toFixed}
            sx={{ flexShrink: 0 }}
          />
        </Box>
        <Tooltip
          expanded={expanded}
          setExpanded={setExpanded}
          aria-label={ariaLabel}
          aria-controls={expanded ? tooltipId : undefined}
          sx={{ mb: '-4px' }}
        />
      </Flex>
      {operator && (
        <Box
          aria-hidden='true'
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
  rps: 'Annual risk of loss incorporates both the probability and relative consequence of wildfire to a structure at a given location. Also known as the expected annual net value change. This value is directly translated into the risk score. Values range from 0 to 100.',
  bp: {
    current:
      'Annual burn probability (BP) for today’s climate (circa 2011) based on fire weather wind direction and landscape conditions. Values range from 0 to 1.',
    future:
      'Annual burn probability (BP) for future climate (circa 2047) based on fire weather wind direction and landscape conditions. Values range from 0 to 1.',
  },
  crps: 'Relative loss in structure value if a wildfire were to occur at a given location. Determined by the modeled intensity of a fire at this location and is largely controlled by local vegetation. Values range from 0 to 100.',
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
  const tooltipRef = useRef<HTMLDivElement>(null)
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

  let tooltip
  if (expanded) {
    tooltip =
      expanded === 'bp' ? TOOLTIP[expanded][timePeriod] : TOOLTIP[expanded]
  }

  useEffect(() => {
    if (expanded && tooltipRef.current) {
      tooltipRef.current.focus()
    }
  }, [expanded])

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
        <Row columns={3} sx={{ ...sx.row, mt: 2, py: 1 }}>
          <Column start={1} width={1}>
            <Box key='rps' sx={sx.tableHead} id='risk-of-loss-label'>
              Risk{' '}
              <Box
                as='br'
                aria-hidden='true'
                sx={{ display: ['block', 'block', 'block', 'none'] }}
              />{' '}
              of loss
            </Box>
          </Column>
          <Column start={2} width={1}>
            <Box key='bp' sx={sx.tableHead} id='burn-probability-label'>
              Burn
              <Box
                as='br'
                aria-hidden='true'
                sx={{ display: ['block', 'block', 'block', 'none'] }}
              />{' '}
              probability
            </Box>
          </Column>
          <Column start={3} width={1}>
            <Box key='bp' sx={sx.tableHead} id='conditional-risk-label'>
              Conditional
              <Box
                as='br'
                aria-hidden='true'
                sx={{ display: ['block', 'block', 'block', 'none'] }}
              />{' '}
              risk
            </Box>
          </Column>
        </Row>
        <Row columns={3} sx={{ ...sx.row, py: 2 }}>
          <Column
            start={1}
            width={1}
            as='section'
            aria-labelledby='risk-of-loss-label'
          >
            <TableCell
              key='rps'
              expanded={expanded === 'rps'}
              setExpanded={(value: boolean) =>
                setExpanded(value ? 'rps' : null)
              }
              value={risk}
              operator='='
              tooltipId='risk-calculation-tooltip'
              aria-label='More information about risk of loss'
            />
          </Column>
          <Column
            start={2}
            width={1}
            as='section'
            aria-labelledby='burn-probability-label'
          >
            <TableCell
              key='bp'
              expanded={expanded === 'bp'}
              setExpanded={(value: boolean) => setExpanded(value ? 'bp' : null)}
              value={bp}
              operator='x'
              unit='#'
              toFixed={3}
              tooltipId='risk-calculation-tooltip'
              aria-label='More information about burn probability'
            />
          </Column>
          <Column
            start={3}
            width={1}
            as='section'
            aria-labelledby='conditional-risk-label'
          >
            <TableCell
              key='crps'
              expanded={expanded === 'crps'}
              setExpanded={(value: boolean) =>
                setExpanded(value ? 'crps' : null)
              }
              value={conditionalRisk}
              unit='%'
              toFixed={1}
              tooltipId='risk-calculation-tooltip'
              aria-label='More information about conditional risk'
            />
          </Column>
        </Row>
        <Box>
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
              <Box
                id='risk-calculation-tooltip'
                ref={tooltipRef}
                tabIndex={-1}
                sx={{ pt: 2, outline: 'none' }}
              >
                {tooltip}
              </Box>
            </AnimateHeight>
          </Column>
        </Box>
      </Box>
    </>
  )
}

export default RiskCalculation
