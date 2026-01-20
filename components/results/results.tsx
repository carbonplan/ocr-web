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

      <Box>
        <Box as='h2' variant='sectionHeading'>
          About
        </Box>
        <Box variant='description'>
          <Box>
            The development of this project by CarbonPlan was funded, in part,
            through a grant from the Patrick J. McGovern Foundation.
          </Box>
          <Box sx={{ mt: 2 }}>
            The web tool and the underlying dataset rely on data from the{' '}
            <Link href='https://docs.overturemaps.org/guides/buildings/'>
              Overture Maps Foundation buildings dataset
            </Link>
            ,{' '}
            <Link href='https://doi.org/10.2737/RDS-2025-0006'>
              K Riley et al. 2025
            </Link>
            ,{' '}
            <Link href='https://doi.org/10.2737/RDS-2020-0016-2'>
              J Scott et al. 2024
            </Link>
            ,{' '}
            <Link href='https://doi.org/10.1175/BAMS-D-21-0326.1'>
              R Rasmussen et al. 2023
            </Link>
            , and{' '}
            <Link href='https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html'>
              Census TIGER/Line
            </Link>
            . Read more about our data sources{' '}
            <Link href='https://docs.carbonplan.org/ocr/en/latest/reference/data-sources.html'>
              here
            </Link>
            .
          </Box>
        </Box>
      </Box>

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
