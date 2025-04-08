import { Box, Flex } from 'theme-ui'
//@ts-ignore
import { Button } from '@carbonplan/components'
import { useLocationStore } from '../store/location'
import { formatAddress } from './geocode'
//@ts-ignore
import { X } from '@carbonplan/icons'

const SelectedLocation = () => {
  const selectedLocation = useLocationStore((state) => state.selectedLocation)
  const setSelectedLocation = useLocationStore(
    (state) => state.setSelectedLocation,
  )
  const selectedBuilding = useLocationStore((state) => state.selectedBuilding)

  if (!selectedLocation) return null

  const handleDeselect = () => {
    setSelectedLocation(null)
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Flex sx={{ gap: 2, alignItems: 'baseline' }}>
        {formatAddress(selectedLocation.address)}
        <Button size='xs' onClick={handleDeselect}>
          <X sx={{ width: 15, height: 15, mb: '-2px' }} />
        </Button>
      </Flex>
      <Flex sx={{ flexDirection: 'column', gap: 2, mt: 2 }}>
        {selectedBuilding &&
          Object.entries(selectedBuilding).map(([key, value]) => (
            <Box sx={{ color: 'secondary' }} key={key}>
              {key}:{' '}
              <Box as='span' sx={{ fontFamily: 'monospace', color: 'primary' }}>
                {value}
              </Box>
            </Box>
          ))}
      </Flex>
    </Box>
  )
}

export default SelectedLocation
