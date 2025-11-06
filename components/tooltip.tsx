import React, { useState } from 'react'
import AnimateHeight from 'react-animate-height'
import { IconButton, Box, Flex, ThemeUIStyleObject } from 'theme-ui'
//@ts-expect-error - carbonplan icons types not available
import { Info } from '@carbonplan/icons'

interface TooltipProps {
  expanded: boolean
  disabled?: boolean
  setExpanded: (value: boolean) => void
  sx?: ThemeUIStyleObject
}
export const Tooltip = ({
  expanded,
  setExpanded,
  sx,
  disabled,
}: TooltipProps) => {
  return (
    <IconButton
      onClick={() => setExpanded(!expanded)}
      disabled={disabled}
      role='checkbox'
      aria-checked={expanded}
      aria-label='Information'
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
        }}
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
          sx={{ mt: mt, flexShrink: 0, ...buttonSx }}
        />
      </Flex>
      <AnimateHeight
        duration={100}
        height={expanded ? 'auto' : 0}
        easing={'linear'}
      >
        <Box sx={{ my: 1, fontSize: [1, 1, 1, 2], color, ...tooltipSx }}>
          {tooltip}
        </Box>
      </AnimateHeight>
    </>
  )
}

export default TooltipWrapper
