import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'

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
          justifyContent: 'space-between',
          flexDirection: ['column', 'row', 'row', 'row'],
        }}
      >
        <Flex
          sx={{
            gap: ['10px', '10px', '10px', '12px'],
          }}
        >
          <Box>(c) {getCurrentYear()}</Box>
          <Box>CARBONPLAN</Box>
        </Flex>
        <Flex
          sx={{
            gap: ['10px', '10px', '10px', '12px'],
            textTransform: 'uppercase',
          }}
        >
          <Link
            href='https://carbonplan.org/terms'
            sx={{
              textDecoration: 'none',
              color: 'secondary',
              '&:hover': { color: 'primary' },
            }}
          >
            Terms
          </Link>{' '}
          /
          <Link
            href='https://carbonplan.org/privacy'
            sx={{
              textDecoration: 'none',
              color: 'secondary',
              '&:hover': { color: 'primary' },
            }}
          >
            Privacy
          </Link>
        </Flex>
      </Flex>
    </>
  )
}

export default Results
