import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'
import OtherFactors from './other-factors'

const FireAbout = () => (
  <Box variant='description'>
    <OtherFactors />
    <Box>
      The development of this project by CarbonPlan was funded, in part, through
      a grant from the Patrick J. McGovern Foundation.
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
)

export default FireAbout
