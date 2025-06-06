import { Box, Container } from 'theme-ui'
//@ts-ignore
import { Dimmer, Header, Meta } from '@carbonplan/components'
//@ts-ignore
import { Map, Sidebar } from '../components'

const Index = () => {
  return (
    <>
      <Meta
        // card TK
        description={'Explore climate risks'}
        title={'Open Climate Risks – CarbonPlan'}
      />
      <Container>
        <Header
          sx={{ zIndex: 10 }}
          menuItems={[
            <Dimmer key='dimmer' sx={{ mt: '-2px', color: 'primary' }} />,
          ]}
        />
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
        <Sidebar />
        <Map />
      </Box>
    </>
  )
}

export default Index
