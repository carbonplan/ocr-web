import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'

const Intro = () => {
  return (
    <>
      <Box
        as='h1'
        sx={{
          fontSize: [4, 5, 5, 6],
          fontFamily: 'heading',
          letterSpacing: 'heading',
          lineHeight: 'heading',
          mb: 3,
        }}
      >
        Open Climate Risk
      </Box>
      <Box sx={{ mb: 3, variant: 'description' }}>
        This explorer shows wildfire risk across the continental US. Search for
        an address or use the map to explore risk data. More hazards will be
        added in the future. Read our{' '}
        <Link href='/research/climate-risk-faq'>FAQ</Link>, the{' '}
        <Link href='/research/climate-risk-explainer'>explainer</Link>, or{' '}
        <Link href='https://docs.carbonplan.org/ocr/en/latest/access-data.html'>
          download the data
        </Link>{' '}
        for more details.
      </Box>
    </>
  )
}

export default Intro
