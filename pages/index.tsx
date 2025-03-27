import { Box, Container } from 'theme-ui'
//@ts-ignore
import { Header, Dimmer } from '@carbonplan/components'
//@ts-ignore
import { Sidebar } from '@carbonplan/layouts'
import { Map, Geocode } from '../components'

const Index = () => {
  return (
    <>
      <Container>
        <Header sx={{ zIndex: 10 }} />
      </Container>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '100%',
          overflowX: 'hidden',
          zIndex: -1,
        }}
      >
        <Sidebar expanded={true} side='left' width={4}>
          <Geocode />
          <Dimmer />
        </Sidebar>
        <Map />
      </Box>
    </>
  )
}

export default Index
