import { useStore } from '@/lib/store'
import RegionalRisk from './regions'
import Section from '../section'

const Inner = () => {
  const hasRegions = useStore((state) => !!state.riskConfig.vector.regions)
  const label = useStore((state) => state.riskConfig.label)

  return hasRegions ? (
    <RegionalRisk />
  ) : (
    `Not yet available for ${label.toLowerCase()}`
  )
}

const RegionalInfo = () => {
  return (
    <Section label='Regional info'>
      <Inner />
    </Section>
  )
}

export default RegionalInfo
