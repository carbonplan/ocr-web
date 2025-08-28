import { useState, useEffect, useRef } from 'react'
import type { SyntheticEvent } from 'react'
import { Box, Container, IconButton } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Dimmer, Guide, Header, Meta } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Info, X } from '@carbonplan/icons'
import { Legend, Map, Sidebar, MobileDrawer, Intro } from '../components'
// @ts-expect-error - carbonplan auth types not available
import { withAuth } from '@carbonplan/auth'
import { useBreakpointIndex } from '@theme-ui/match-media'

const Index = () => {
  const index = useBreakpointIndex()
  const [showIntro, setShowIntro] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowIntro(index < 2)
  }, [index])

  useEffect(() => {
    if (!showIntro) return
    const handleOutsideIntroModal = (event: Event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowIntro(false)
      }
    }
    document.addEventListener('touchstart', handleOutsideIntroModal, {
      passive: true,
    })
    document.addEventListener('mousedown', handleOutsideIntroModal)
    return () => {
      document.removeEventListener('touchstart', handleOutsideIntroModal)
      document.removeEventListener('mousedown', handleOutsideIntroModal)
    }
  }, [showIntro])

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
              index < 2 ? (
                <Info
                  key='info'
                  onTouchStart={(e: SyntheticEvent) => e.stopPropagation()}
                  onClick={() => setShowIntro((prev) => !prev)}
                  sx={{ color: showIntro ? 'secondary' : 'primary' }}
                />
              ) : null,
            ]}
          />
          {showIntro && (
            <Box
              ref={modalRef}
              sx={{
                p: 4,
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
        {index < 2 ? <MobileDrawer /> : <Sidebar />}
        <Map />
        <Legend />
      </Box>
    </>
  )
}

export default withAuth(Index, ['user', 'admin'])
