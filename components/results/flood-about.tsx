import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'

const FloodAbout = () => (
  <Box>
    <Box as='h2' variant='sectionHeading'>
      About
    </Box>
    <Box variant='description'>
      <Box>
        Flood damage probability comes from the random forest model of{' '}
        <Link href='https://doi.org/10.1088/1748-9326/ac4f0f'>
          Collins et al. 2022
        </Link>
        , published by the USGS as a{' '}
        <Link href='https://doi.org/10.5066/P954TTQN'>
          100 m raster covering the contiguous United States
        </Link>
        . Building footprints come from the{' '}
        <Link href='https://docs.overturemaps.org/guides/buildings/'>
          Overture Maps Foundation buildings dataset
        </Link>
        .
      </Box>
      <Box sx={{ mt: 2 }}>
        The model was trained on NOAA Storm Events flood damage reports against
        sampled absence points, so it ranks where damage has been reported and
        is likely, not how deep or how costly a flood would be. Populated,
        well-observed places are better represented in that record. Its
        predictors describe recent conditions, so unlike the other layers here
        it carries no climate scenario.
      </Box>
    </Box>
  </Box>
)

export default FloodAbout
