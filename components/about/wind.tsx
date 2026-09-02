import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'

const WindAbout = () => (
  <Box variant='description'>
    <Box>
      Wind hazard estimates are derived from the Columbia HAZard model (
      <Link href='https://doi.org/10.1002/2017MS001186'>
        CHAZ, Lee et al. 2018
      </Link>
      ), using the tropical cyclone wind dataset published by{' '}
      <Link href='https://doi.org/10.5061/dryad.qfttdz0vz'>Meiler et al.</Link>{' '}
      and the wind-damage relationship of{' '}
      <Link href='https://doi.org/10.1175/WCAS-D-11-00007.1'>Emanuel 2011</Link>
      . Building footprints come from the{' '}
      <Link href='https://docs.overturemaps.org/guides/buildings/'>
        Overture Maps Foundation buildings dataset
      </Link>
      .
    </Box>
    <Box sx={{ mt: 2 }}>
      Methods documentation for the wind hazard layer is in progress.
    </Box>
  </Box>
)

export default WindAbout
