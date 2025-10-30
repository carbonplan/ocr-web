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
        Open Fire Risk
      </Box>
      <Box sx={{ mb: 3, variant: 'description' }}>
        This explorer shows fire risk across the continental US. Search for an
        address or use the map to explore risk data. More risks will be added in
        the future. Read our <Link href='#TK'>methods</Link>, the{' '}
        <Link href='#TK'>FAQs</Link>, or{' '}
        <Link href='#TK'>download the data</Link> for more details.
      </Box>
    </>
  )
}

export default Intro
