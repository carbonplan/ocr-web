import { Box } from 'theme-ui'

const PlaceholderSection = ({
  title,
  copy,
}: {
  title: string
  copy: string
}) => (
  <Box>
    <Box as='h2' variant='sectionHeading'>
      {title}
    </Box>
    <Box variant='description' sx={{ color: 'secondary' }}>
      {copy}
    </Box>
  </Box>
)

export default PlaceholderSection
