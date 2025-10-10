import React from 'react'
import { Box, ThemeUIStyleObject } from 'theme-ui'
import {
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { mix } from '@theme-ui/color'
import chroma from 'chroma-js'

const Wrapper = ({
  lowValue,
  children,
}: {
  lowValue: boolean
  children: React.ReactNode
}) => {
  if (lowValue) {
    return <Box sx={{ position: 'relative' }}>{children}</Box>
  } else {
    return <>{children}</>
  }
}
const ValueBadge = ({
  value,
  color,
  sx,
  lowValue = false,
  unit = '%',
}: {
  value?: string | number | null
  color?: string
  unit?: string
  lowValue?: boolean
  sx?: ThemeUIStyleObject
}) => {
  let formattedValue
  if (typeof value === 'number') {
    formattedValue = lowValue ? 0.01 : value.toFixed(2)
  } else if (typeof value === 'string') {
    formattedValue = value
  }
  return (
    <Wrapper lowValue={lowValue}>
      {lowValue && (
        <Box
          as='span'
          sx={{
            color: 'secondary',
            fontFamily: 'mono',
            position: 'absolute',
            ml: '-12px',
          }}
        >
          {'<'}
        </Box>
      )}
      <Badge
        sx={{
          fontSize: [1, 1, 1, 2],
          height: [21, 21, 21, 22],
          mb: '-5px',
          ...(color
            ? {
                backgroundColor: color,
                color: chroma.valid(color)
                  ? mix('background', 'primary', chroma(color).luminance())
                  : 'primary',
              }
            : {}),
          ...sx,
        }}
      >
        {value == null ? (
          <>&nbsp;&nbsp;{unit}&nbsp;&nbsp;</>
        ) : (
          `${formattedValue}${unit === '%' ? '%' : ''}`
        )}
      </Badge>
    </Wrapper>
  )
}

export default ValueBadge
