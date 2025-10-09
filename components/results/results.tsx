import React from 'react'

import RiskCalculation from './risk-calculation'
import TimeHorizons from './time-horizons'
import OtherFactors from './other-factors'
import RegionalRisk from './regional-risk'
import RiskScore from './risk-score'

const Results = () => {
  return (
    <>
      <RiskScore />
      <RiskCalculation />
      <TimeHorizons />
      <RegionalRisk />
      <OtherFactors />
    </>
  )
}

export default Results
