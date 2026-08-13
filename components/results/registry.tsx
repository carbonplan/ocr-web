import { ComponentType } from 'react'
import { ResultSectionKey } from '@/lib/hazards'
import RiskCalculation from './risk-calculation'
import TimeHorizons from './time-horizons'
import RegionalRisk from './regional-risk'
import OtherFactors from './other-factors'
import FireAbout from './fire-about'
import WindDetail from './wind-detail'
import WindAbout from './wind-about'
import FloodAbout from './flood-about'

// Components render their own headings; title is used when a hazard config
// marks the section as a placeholder.
export const RESULT_SECTIONS: Record<
  ResultSectionKey,
  { component: ComponentType; title: string }
> = {
  riskCalculation: { component: RiskCalculation, title: 'Risk calculation' },
  timeHorizons: { component: TimeHorizons, title: 'Risk over time' },
  regionalRisk: { component: RegionalRisk, title: 'Risk in the region' },
  otherFactors: { component: OtherFactors, title: 'Other factors' },
  fireAbout: { component: FireAbout, title: 'About' },
  windDetail: { component: WindDetail, title: 'Expected annual loss' },
  windAbout: { component: WindAbout, title: 'About' },
  floodAbout: { component: FloodAbout, title: 'About' },
}
