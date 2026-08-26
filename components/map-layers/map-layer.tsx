import { Box, Flex } from 'theme-ui'
import ValueBadge from '../results/value-badge'
import EyeCheckbox from '../eye-checkbox'

interface Props {
  label: string
  value: number | string | null
  unit?: string
  color?: string
  checked: boolean
  setChecked: () => void
}
const MapLayer = ({
  label,
  value,
  unit,
  color,
  checked,
  setChecked,
}: Props) => {
  return (
    <Flex sx={{ justifyContent: 'space-between' }} as='label'>
      <Box>{label}</Box>
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
  )
}

export default MapLayer
