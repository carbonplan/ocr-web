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
        This explorer shows fire risk across the continental US. Search for an
        address or use the map to explore risk data. More risks will be added in
        the future. Read our <Link href='#TK'>methods</Link>, the{' '}
        <Link href='#TK'>explainer</Link>, or{' '}
        <Link href='#TK'>download the data</Link> for more details.
        <Box sx={{ mt: 3, color: 'secondary', fontSize: 1 }}>
          By viewing Open Climate Risk, you agree to CarbonPlan’s{' '}
          <Link sx={{ color: 'secondary' }} href='https://carbonplan.org/terms'>
            Terms of Use
          </Link>{' '}
          and{' '}
          <Link
            sx={{ color: 'secondary' }}
            href='https://carbonplan.org/privacy'
          >
            Privacy Policy
          </Link>
          .
        </Box>
      </Box>
    </>
  )
}

export default Intro
