import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'

const FloodAbout = () => (
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
      . Previous floods combine three records: flood and flash flood reports
      from the{' '}
      <Link href='https://www.ncei.noaa.gov/access/storm-events-database/'>
        NOAA Storm Events Database
      </Link>
      , the same record the model was trained on; flood water mapped from MODIS
      imagery by the{' '}
      <Link href='https://doi.org/10.1038/s41586-021-03695-w'>
        Global Flood Database
      </Link>{' '}
      (Tellman et al. 2021, CC BY-NC 4.0); and places named in news coverage of
      flooding from{' '}
      <Link href='https://doi.org/10.5281/zenodo.18647054'>
        Google Groundsource
      </Link>{' '}
      (CC BY 4.0).
    </Box>
    <Box sx={{ mt: 2 }}>
      The model was trained on NOAA Storm Events flood damage reports against
      sampled absence points, so it ranks where damage has been reported and is
      likely, not how deep or how costly a flood would be. Populated,
      well-observed places are better represented in that record. Its predictors
      describe recent conditions, so unlike the other layers here it carries no
      climate scenario.
    </Box>
  </Box>
)

export default FloodAbout
