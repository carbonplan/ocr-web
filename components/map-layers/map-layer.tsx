import { Box, Flex } from 'theme-ui'
import ValueBadge, { Props as ValueBadgeProps } from '../value-badge'
import EyeCheckbox from '../eye-checkbox'
import AnimateHeight from 'react-animate-height'
import { ReactNode } from 'react'

interface Props extends ValueBadgeProps {
  label: string
  checked: boolean
  setChecked: () => void
  children?: ReactNode
}
const MapLayer = ({
  label,
  checked,
  color,
  setChecked,
  children,
  ...props
}: Props) => {
  return (
    <Box>
      <Flex
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          '&:hover > div': { color: 'primary' },
        }}
        as='label'
      >
        <Box
          variant='label'
          sx={{
            color: checked ? 'primary' : 'secondary',
            transition: 'color 0.2s',
            fontSize: [1, 1, 1, 2],
          }}
        >
          {label}
        </Box>
        <Flex sx={{ gap: 2 }}>
          <ValueBadge
            {...props}
            color={checked ? color : undefined}
            sx={{ flexShrink: 0 }}
          />
          <EyeCheckbox
            checked={checked}
            onChange={() => (checked ? null : setChecked())}
            aria-label={`Toggle ${label} visibility`}
          />
        </Flex>
      </Flex>
      <AnimateHeight
        duration={100}
        height={checked ? 'auto' : 0}
        easing={'linear'}
      >
        <Box sx={{ pt: 2 }}>{children}</Box>
      </AnimateHeight>
    </Box>
  )
}

export default MapLayer
