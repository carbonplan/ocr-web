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
        This explorer shows fire risk across the continental U.S. Search for an
        address or use the map to explore risk data. More hazards will be added
        in the future. Read our{' '}
        <Link href='/research/climate-risk-faq'>FAQ</Link>, the{' '}
        <Link href='/research/climate-risk-explainer'>explainer</Link>, or{' '}
        <Link href='https://carbonplan.github.io/ocr/reference/data-downloads/'>
          download the data
        </Link>{' '}
        for more details.
      </Box>
    </>
  )
}

export default Intro
