import { Box, Container } from 'theme-ui'
import { Badge, Button, Header, Dimmer } from '@carbonplan/components'
import { Sidebar } from '@carbonplan/layouts'
import { RotatingArrow } from '@carbonplan/icons'
import Map from '../components/map'

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
          <Badge sx={{ color: 'green' }}>Open Climate Risk</Badge>
          <Button prefix={<RotatingArrow />} suffix={<RotatingArrow />}>
            test
          </Button>
          <Dimmer />
        </Sidebar>
        <Map />
      </Box>
    </>
  )
}

export default Index
