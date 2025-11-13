import { Box, Flex } from 'theme-ui'

import RiskCalculation from './risk-calculation'
import TimeHorizons from './time-horizons'
import OtherFactors from './other-factors'
import RegionalRisk from './regional-risk'
import RiskScore from './risk-score'

const getCurrentYear = () => new Date().getFullYear()

const Results = () => {
  return (
    <>
      <RiskScore />
      <RiskCalculation />
      <TimeHorizons />
      <RegionalRisk />
      <OtherFactors />
      <Flex
        sx={{
          mt: 5,
          color: 'secondary',
          fontSize: [1, 1, 1, 2],
          fontFamily: 'mono',
          letterSpacing: 'mono',
          gap: ['10px', '10px', '10px', '12px'],
        }}
      >
        <Box>(c) {getCurrentYear()}</Box>
        <Box>CARBONPLAN</Box>
      </Flex>
    </>
  )
}

export default Results
