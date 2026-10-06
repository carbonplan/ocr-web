import { useStore } from '@/lib/store'
import RegionalFire from './fire'
import Section from '../section'

const Inner = () => {
  const id = useStore((state) => state.riskConfig.id)

  switch (id) {
    case 'fire':
      return <RegionalFire />
    case 'flood':
      return 'Not yet available for flood'
    case 'hurricane':
      return 'Not yet available for hurricane'
    default:
      break
  }
}

const RegionalInfo = () => {
  return (
    <Section label='Regional info'>
      <Inner />
    </Section>
  )
}

export default RegionalInfo
