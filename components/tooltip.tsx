import React, { useState, useId } from 'react'
import AnimateHeight from 'react-animate-height'
import { IconButton, Box, Flex, ThemeUIStyleObject } from 'theme-ui'
//@ts-expect-error - carbonplan icons types not available
import { Info } from '@carbonplan/icons'

interface TooltipProps {
  expanded: boolean
  disabled?: boolean
  setExpanded: (value: boolean) => void
  sx?: ThemeUIStyleObject
  'aria-controls'?: string
  'aria-label'?: string
}
export const Tooltip = ({
  expanded,
  setExpanded,
  sx,
  disabled,
  'aria-controls': ariaControls,
  'aria-label': ariaLabel = 'More information',
}: TooltipProps) => {
  return (
    <IconButton
      onClick={() => setExpanded(!expanded)}
      disabled={disabled}
      aria-expanded={expanded}
      aria-controls={ariaControls}
      aria-label={ariaLabel}
      sx={{
        cursor: 'pointer',
        height: '16px',
        width: '16px',
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover > #info': {
            stroke: !disabled ? 'primary' : '',
          },
        },
        p: [0],
        ...sx,
      }}
    >
      <Info
        id='info'
        height='16px'
        width='16px'
        sx={{
          stroke: expanded ? 'primary' : 'secondary',
          opacity: disabled ? 0.5 : 1,
          transition: '0.1s',
          // the circle's stroke extends past the viewBox edge; without this
          // the default hidden overflow clips it
          overflow: 'visible',
        }}
        aria-hidden='true'
      />
    </IconButton>
  )
}

interface TooltipWrapperProps {
  children: React.ReactNode
  disabled?: boolean
  tooltip: string | React.ReactNode
  mt?: number
  color?: string
  sx?: ThemeUIStyleObject
  buttonSx?: ThemeUIStyleObject
  tooltipSx?: ThemeUIStyleObject
}

const TooltipWrapper = ({
  children,
  tooltip,
  mt = 0,
  color = 'secondary',
  sx,
  buttonSx,
  disabled = false,
  tooltipSx,
}: TooltipWrapperProps) => {
  const [expanded, setExpanded] = useState(false)
  const id = useId()

  return (
    <>
      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          ...sx,
        }}
      >
        {children}
        <Tooltip
          disabled={disabled}
          expanded={expanded}
          setExpanded={setExpanded}
          aria-controls={id}
          sx={{ mt: mt, flexShrink: 0, ...buttonSx }}
        />
      </Flex>
      <AnimateHeight
        duration={100}
        height={expanded ? 'auto' : 0}
        easing={'linear'}
      >
        <Box
          id={id}
          sx={{ my: 1, fontSize: [1, 1, 1, 2], color, ...tooltipSx }}
        >
          {tooltip}
        </Box>
      </AnimateHeight>
    </>
  )
}

export default TooltipWrapper
