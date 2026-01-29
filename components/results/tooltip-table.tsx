import { Box, Flex } from 'theme-ui'
import {
  Column,
  Row,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useEffect, useRef, ReactNode, useState } from 'react'
import AnimateHeight from 'react-animate-height'

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
  tooltipId: string
  'aria-label': string
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

interface Props<T extends string> {
  values: {
    key: T
    value: number | null
    aria: string
    label: ReactNode
    operator?: string
    unit?: string
    toFixed?: number
  }[]
  tooltips: Record<T, ReactNode>
  tooltipId: string
}

function TooltipTable<T extends string>({
  values,
  tooltips,
  tooltipId,
}: Props<T>) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState<T | null>(null)
  let tooltip
  if (expanded) {
    tooltip = tooltips[expanded]
  }

  useEffect(() => {
    if (expanded && tooltipRef.current) {
      tooltipRef.current.focus()
    }
  }, [expanded])

  return (
    <Box>
      <Row columns={3} sx={{ ...sx.row, mt: 2, py: 1 }}>
        <Column start={1} width={1}>
          <Box sx={sx.tableHead} id={`${values[0].key}-label`}>
            {values[0].label}
          </Box>
        </Column>
        <Column start={2} width={1}>
          <Box sx={sx.tableHead} id={`${values[1].key}-label`}>
            {values[1].label}
          </Box>
        </Column>
        <Column start={3} width={1}>
          <Box sx={sx.tableHead} id={`${values[2].key}-label`}>
            {values[2].label}
          </Box>
        </Column>
      </Row>
      <Row columns={3} sx={{ ...sx.row, py: 2 }}>
        {values.map(({ key, value, aria, ...rest }, i) => (
          <Column
            key={key}
            start={1 + i}
            width={1}
            as='section'
            aria-labelledby={`${key}-label`}
          >
            <TableCell
              expanded={expanded === key}
              setExpanded={(value: boolean) => setExpanded(value ? key : null)}
              value={value}
              tooltipId={tooltipId}
              aria-label={aria}
              {...rest}
            />
          </Column>
        ))}
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
              id={tooltipId}
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
  )
}

export default TooltipTable
