import { Box, Container, Flex } from 'theme-ui'
//@ts-ignore
import { Header, Dimmer, Tag } from '@carbonplan/components'
//@ts-ignore
import { Sidebar } from '@carbonplan/layouts'
import { Map, Geocode, SelectedLocation } from '../components'
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
          <Flex
            sx={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <Box>
              <Geocode />
              <SelectedLocation />
            </Box>
            <Flex sx={{ justifyContent: 'space-between' }}>
              <Dimmer />
              <Tag
                label='Satellite'
                value={satellite}
                onClick={() => setSatellite(!satellite)}
              >
                Satellite
              </Tag>
            </Flex>
          </Flex>
        </Sidebar>
        <Map />
      </Box>
    </>
  )
}

export default Index
