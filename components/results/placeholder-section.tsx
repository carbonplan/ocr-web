import { Box } from 'theme-ui'

// Section shell for hazard data products still in production — shows what's
// coming instead of silently omitting the section.
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
