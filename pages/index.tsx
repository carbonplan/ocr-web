import { Box, Container } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Dimmer, Guide, Header, Meta } from '@carbonplan/components'
import { Legend, Map, Sidebar } from '../components'
// @ts-expect-error - carbonplan auth types not available
import { withAuth } from '@carbonplan/auth'

const Index = () => {
  return (
    <>
      <Meta
        // card TK
        description={'Explore climate risks'}
        title={'Open Climate Risks – CarbonPlan'}
      />

      <Container>
        <Guide color='teal' />
      </Container>

      <Box
        sx={{
          position: 'sticky',
          top: 0,
          height: '56px',
          zIndex: 5000,
          pointerEvents: 'none',
        }}
      >
        <Container>
          <Header
            menuItems={[
              <Dimmer key='dimmer' sx={{ mt: '-2px', color: 'primary' }} />,
            ]}
          />
        </Container>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '100%',
          overflowX: 'hidden',
        }}
      >
        <Sidebar />
        <Map />
        <Legend />
      </Box>
    </>
  )
}

export default withAuth(Index, ['user', 'admin'])
