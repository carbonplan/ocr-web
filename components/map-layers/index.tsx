import { Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import Section from '../section'
import FireLayers from './fire'
import WindLayers from './wind'

const Inner = () => {
  const id = useStore((state) => state.riskConfig.id)

  switch (id) {
    case 'fire':
      return <FireLayers />
    case 'flood':
      return 'TK'
    case 'wind':
      return <WindLayers />
    default:
      break
  }
}

const MapLayers = () => {
  return (
    <Section label='Map layers'>
      <Flex sx={{ flexDirection: 'column', gap: 3 }}>
        <Inner />
      </Flex>
    </Section>
  )
}

export default MapLayers
