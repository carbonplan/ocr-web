import { Box, Container } from 'theme-ui'
//@ts-ignore
import { Header, Dimmer, Tag } from '@carbonplan/components'
//@ts-ignore
import { Sidebar } from '@carbonplan/layouts'
import { Map, Geocode } from '../components'
import { useLocationStore } from '../store/location'
const Index = () => {
  const { satellite, setSatellite } = useLocationStore()
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
          <Tag
            label='Satellite'
            value={satellite}
            onClick={() => setSatellite(!satellite)}
            sx={{
              mt: 3,
            }}
          >
            Satellite
          </Tag>

          <Dimmer sx={{ position: 'absolute', bottom: 4, left: 4 }} />
        </Sidebar>
        <Map />
      </Box>
    </>
  )
}

export default Index
