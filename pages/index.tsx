import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Box, Container, IconButton, Spinner } from 'theme-ui'
import { useBreakpointIndex } from '@theme-ui/match-media'
//@ts-expect-error - carbonplan components types not available
import { Dimmer, Guide, Header, Meta } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Info, X } from '@carbonplan/icons'
import { withAuth } from '@carbonplan/auth'
import {
  Agreement,
  AgreementPopup,
  Legend,
  Map,
  Sidebar,
  MobileDrawer,
  Intro,
  Loading,
} from '../components'
import { useStore } from '@/lib/store'
import { getHazardFromQuery } from '@/lib/url-utils'
import { withPlausible } from '@/hocs/with-plausible'

const AGREEMENT_KEY = 'ocr.agreement'

const Index = () => {
  const router = useRouter()
  const [showIntro, setShowIntro] = useState(true)
  const [showAgreement, setShowAgreement] = useState(false)
  const breakpointIndex = useBreakpointIndex({ defaultIndex: 2 })
  const isMobile = breakpointIndex < 2
  const isLoading = useStore(
    (state) => state.mapLoading || state.reverseGeocodeLoading,
  )
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowAgreement(localStorage.getItem(AGREEMENT_KEY) !== 'true')
  }, [])

  // must run before the building selection is restored, so query-mode hazards
  // query the right store
  useEffect(() => {
    if (!router.isReady) return
    const params = getHazardFromQuery(router.query)
    if (params) {
      const { setHazard, setFutureWindow } = useStore.getState()
      if (params.futureWindow) setFutureWindow(params.futureWindow)
      setHazard(params.hazard)
      if (params.mapLayer) {
        const { setMapLayer } = useStore.getState()
        setMapLayer(params.mapLayer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

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
        card='https://images.carbonplan.org/social/climate-risk.png'
        description={'Explore climate risk across the contiguous U.S.'}
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
              isMobile && isLoading && <Spinner key='spinner' size={28} />,
              <Dimmer key='dimmer' sx={{ mt: '-2px', color: 'primary' }} />,
              isMobile && (
                <IconButton
                  key='info'
                  aria-label={showIntro ? 'Hide intro' : 'Show intro'}
                  aria-pressed={showIntro}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setShowIntro((s) => !s)
                  }}
                  sx={{ color: showIntro ? 'secondary' : 'primary' }}
                >
                  <Info />
                </IconButton>
              ),
            ].filter(Boolean)}
          />
          {showAgreement && <AgreementPopup onClick={handleAgreement} />}

          {isMobile && (showIntro || showAgreement) && (
            <Box
              ref={modalRef}
              sx={{
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
        {isMobile ? <MobileDrawer /> : <Sidebar />}
        <Loading />
        <Map />
        <Legend />
      </Box>
    </>
  )
}

export default withAuth(withPlausible(Index), ['admin'])
