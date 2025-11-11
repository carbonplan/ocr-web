import { useState, useEffect, useRef } from 'react'
import { Box, Container, IconButton, Spinner } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Dimmer, Guide, Header, Meta } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Info, X } from '@carbonplan/icons'
import {
  Legend,
  Map,
  Sidebar,
  MobileDrawer,
  Intro,
  Loading,
  MapLayers,
} from '../components'
import { useStore } from '@/lib/store'
import { withAuthAndPlausible } from '@/hocs/with-auth-and-plausible'

const Index = () => {
  const [showIntro, setShowIntro] = useState(true)
  const isLoading = useStore(
    (state) => state.mapLoading || state.reverseGeocodeLoading,
  )
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showIntro) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      const insideModal = modalRef.current?.contains(target)
      if (!insideModal) setShowIntro(false)
    }
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showIntro])

  return (
    <>
      <Meta
        // card TK
        description={'Explore fire risk across the continental U.S.'}
        title={'Open Climate Risk – CarbonPlan'}
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
              <Spinner
                key='spinner'
                size={28}
                sx={{
                  display: isLoading
                    ? ['inherit', 'inherit', 'none', 'none']
                    : 'none',
                }}
              />,
              <Dimmer key='dimmer' sx={{ mt: '-2px', color: 'primary' }} />,
              <IconButton
                key='info'
                aria-label={showIntro ? 'Hide intro' : 'Show intro'}
                aria-pressed={showIntro}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  setShowIntro((s) => !s)
                }}
                sx={{
                  display: ['block', 'block', 'none'],
                  color: showIntro ? 'secondary' : 'primary',
                }}
              >
                <Info />
              </IconButton>,
            ]}
          />
          {showIntro && (
            <Box
              ref={modalRef}
              sx={{
                display: ['block', 'block', 'none'],
                p: 4,
                mt: -2,
                bg: 'background',
                border: '1px solid',
                borderColor: 'muted',
                position: 'relative',
                pointerEvents: 'auto',
              }}
            >
              <IconButton
                onClick={() => setShowIntro(false)}
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  p: 1,
                  color: 'secondary',
                }}
              >
                <X />
              </IconButton>
              <Intro />
            </Box>
          )}
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
        <MobileDrawer />
        <Loading />
        <MapLayers />
        <Map />
        <Legend />
      </Box>
    </>
  )
}

export default withAuthAndPlausible(Index)
