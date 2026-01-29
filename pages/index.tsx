import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Box, Container, IconButton, Spinner } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Dimmer, Guide, Header, Meta } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Info, X } from '@carbonplan/icons'
import {
  Agreement,
  AgreementPopup,
  Legend,
  Map,
  Sidebar,
  Intro,
  Loading,
  MapLayers,
} from '../components'

const MobileDrawer = dynamic(() => import('../components/mobile-drawer'), {
  ssr: false,
})
import { useStore } from '@/lib/store'
import { withPlausible } from '@/hocs/with-plausible'

const AGREEMENT_KEY = 'ocr.agreement'

const Index = () => {
  const [showIntro, setShowIntro] = useState(true)
  const [showAgreement, setShowAgreement] = useState(false)
  const isLoading = useStore(
    (state) => state.mapLoading || state.reverseGeocodeLoading,
  )
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowAgreement(localStorage.getItem(AGREEMENT_KEY) !== 'true')
  }, [])

  useEffect(() => {
    if (!showIntro || showAgreement) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      const insideModal = modalRef.current?.contains(target)
      if (!insideModal) setShowIntro(false)
    }
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [showIntro, showAgreement])

  useEffect(() => {
    if (!showAgreement) return
    const onKeydown = (event: KeyboardEvent) => {
      const target = event.target as Node

      if (
        event.key !== 'Tab' &&
        !document.getElementById('agreement')?.contains(target)
      ) {
        event.preventDefault()
      }
    }
    document.addEventListener('keydown', onKeydown)
    return () => document.removeEventListener('keydown', onKeydown)
  }, [showIntro, showAgreement])

  const handleAgreement = useCallback(() => {
    localStorage.setItem(AGREEMENT_KEY, 'true')
    setShowAgreement(false)
  }, [])

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
          '& svg': { zIndex: 5000, position: 'relative' },
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
          {showAgreement && <AgreementPopup onClick={handleAgreement} />}

          {(showIntro || showAgreement) && (
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
                zIndex: 2,
              }}
            >
              {!showAgreement && (
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
              )}
              <Intro />

              {showAgreement && (
                <Agreement
                  onClick={() => {
                    handleAgreement()
                    setShowIntro(false)
                  }}
                />
              )}
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

export default withPlausible(Index)
