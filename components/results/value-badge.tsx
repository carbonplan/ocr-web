import { Box, ThemeUIStyleObject, useThemeUI } from 'theme-ui'
import {
  Badge,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
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
  toFixed = 2,
  lowValue = false,
  unit = '%',
}: {
  value?: string | number | null
  color?: string
  unit?: string
  toFixed?: number
  lowValue?: boolean
  sx?: ThemeUIStyleObject
}) => {
  const { theme } = useThemeUI()
  let formattedValue
  if (typeof value === 'number') {
    formattedValue = lowValue ? 1 * 10 ** -toFixed : value.toFixed(toFixed)
  } else if (typeof value === 'string') {
    formattedValue = value
  }

  let colors: Partial<ThemeUIStyleObject> = {}
  if (color) {
    // For all colormap colors...
    if (chroma.valid(color)) {
      // Use secondary when background fails to contrast with color (lightmode-only)
      const contrast = chroma.contrast(
        color,
        theme.rawColors?.background as string,
      )
      const textColor = contrast > 2 ? 'background' : 'secondary'
      colors = {
        backgroundColor: color,
        color: textColor,
      }
    } else {
      colors = { backgroundColor: color, color: 'primary' } // otherwise, use primary.
    }
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
          ...colors,
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
