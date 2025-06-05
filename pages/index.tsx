import { Box, Container } from 'theme-ui'
//@ts-ignore
import { Header } from '@carbonplan/components'
//@ts-ignore
import { Map, Sidebar } from '../components'

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
        <Sidebar />
        <Map />
      </Box>
    </>
  )
}

export default Index
