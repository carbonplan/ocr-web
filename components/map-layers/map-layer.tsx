import { Box, Flex } from 'theme-ui'
import ValueBadge from '../results/value-badge'
import EyeCheckbox from '../eye-checkbox'
import AnimateHeight from 'react-animate-height'
import { ReactNode } from 'react'

interface Props {
  label: string
  value: number | string | null
  unit?: string
  color?: string
  checked: boolean
  setChecked: () => void
  children?: ReactNode
}
const MapLayer = ({
  label,
  value,
  unit,
  color,
  checked,
  setChecked,
  children,
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
          }}
        >
          {label}
        </Box>
        <Flex sx={{ gap: 2 }}>
          <ValueBadge
            value={value}
            unit={unit}
            color={color}
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
        {children}
      </AnimateHeight>
    </Box>
  )
}

export default MapLayer
