import { Box } from 'theme-ui'

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
      <Box sx={{ mb: 3, variant: 'description' }}>TK TK TK</Box>
    </>
  )
}

export default Intro
