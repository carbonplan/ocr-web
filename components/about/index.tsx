import { useStore } from '@/lib/store'
import FireAbout from './fire'
import FloodAbout from './flood'
import HurricaneAbout from './hurricane'
import Section from '../section'

const AboutInner = () => {
  const id = useStore((state) => state.riskConfig.id)

  switch (id) {
    case 'fire':
      return <FireAbout />
    case 'flood':
      return <FloodAbout />
    case 'hurricane':
      return <HurricaneAbout />
    default:
      break
  }
}

const About = () => {
  return (
    <Section label='About'>
      <AboutInner />
    </Section>
  )
}

export default About
