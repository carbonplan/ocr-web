import { Box, ThemeUIStyleObject, useThemeUI } from 'theme-ui'
import {
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { mix } from '@theme-ui/color'
import { ReactNode, useCallback } from 'react'

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

export interface Props {
  value?: string | number | null
  color?: string
  unit?: string
  toFixed?: number
  sx?: ThemeUIStyleObject
  whitespace?: boolean
}
const ValueBadge = ({
  value,
  color,
  sx,
  toFixed = 2,
  unit = '%',
  whitespace = true,
}: Props) => {
  const { theme } = useThemeUI()
  let formattedValue
  let lowValue = false
  if (typeof value === 'number') {
    const threshold = 1 * 10 ** -toFixed
    lowValue = value > 0 && value < threshold
    formattedValue = lowValue ? threshold : value.toFixed(toFixed)
  } else if (typeof value === 'string') {
    formattedValue = value
  }

  const colors: Partial<ThemeUIStyleObject> = {
    backgroundColor: color ?? mix('muted', 'background', 0.3)(theme),
    color: value == null ? 'secondary' : 'primary',
  }

  const handleCopy = useCallback(
    (event: ClipboardEvent) => {
      event.preventDefault()
      if (event.clipboardData) {
        event.clipboardData.setData(
          'text/plain',
          `${value}${unit === '#' ? '' : unit}`,
        )
      }
    },
    [value, unit],
  )

  let content: string | ReactNode =
    `${formattedValue}${unit === '%' ? '%' : ''}`

  if (value == null && whitespace) {
    content = <>&nbsp;&nbsp;{unit}&nbsp;&nbsp;</>
  } else if (value == null) {
    content = <>{unit}</>
  } else if (
    typeof content === 'string' &&
    content.length === 1 &&
    whitespace
  ) {
    content = <>&nbsp;&nbsp;{content}&nbsp;&nbsp;</>
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
          transition: 'all 0.2s',
          userSelect: typeof value == 'number' ? 'all' : 'none',
          pt: ['1px', 0, 0, 0],
          ...colors,
          ...sx,
        }}
        onCopy={handleCopy}
      >
        {content}
      </Badge>
    </Wrapper>
  )
}

export default ValueBadge
