import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar } from '@carbonplan/layouts'
import { Display, Geocode, Results } from '../components'

const SidebarComponent = () => {
  return (
    <Sidebar expanded={true} side='left' width={4}>
      <Box
        as='h1'
        sx={{
          fontSize: [5, 5, 5, 6],
          fontFamily: 'heading',
          letterSpacing: 'heading',
          lineHeight: 'heading',
          mb: 3,
        }}
      >
        Open Climate Risks
      </Box>
      <Box sx={{ mb: 3 }}>
        This explorer lets you browse datasets containing different climate
        risks. Use the map to explore risk data at address, census block, and
        census tract levels. Read our methods, the FAQs, or analysis examples
        for more details.
      </Box>
      <Geocode />
      <Results />
      <Display />
    </Sidebar>
  )
}

export default SidebarComponent
