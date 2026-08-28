import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'

import { Geocode, Display, MapLayers } from '@/components'
import { Drawer } from 'vaul'
import ClimateSelector from './climate-selector'
import HazardSelector from './hazard-selector'
import TimePeriodSelector from './time-period-selector'
import Colorbar from './colorbar'
import RegionalInfo from './regional-info'
import About from './about'
import Footer from './footer'

const MobileDrawer = () => {
  // weird bug, adding two extra final snap points fixes drawer not following drag in all cases.
  const snapPoints = useMemo(() => ['140px', 0.54, 0.94, 0.94, 0.94], [])

  const [snap, setSnap] = useState<number | string | null>(snapPoints[1])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const advancedMode = useStore((state) => state.advancedMode)

  useEffect(() => {
    if (selectedBuilding || selectedArea) {
      setSnap(snapPoints[1])
    }
  }, [selectedBuilding, selectedArea, setSnap, snapPoints])

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }, [snap])

  return (
    <Box sx={{ display: ['block', 'block', 'none'] }}>
      <Drawer.Root
        open={true}
        defaultOpen={true}
        snapPoints={snapPoints}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        modal={false}
        dismissible={false}
        repositionInputs={false}
        preventScrollRestoration={true}
        handleOnly
      >
        {/* hidden accessibility elements */}
        <Drawer.Title
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            overflow: 'hidden',
          }}
        >
          Mobile drawer for search, settings, and risk
        </Drawer.Title>
        <Drawer.Description
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            overflow: 'hidden',
          }}
        >
          Search for an address, adjust settings, and view risk details
        </Drawer.Description>
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            zIndex: 2,
            outline: 'none',
          }}
        >
          <Flex
            sx={{
              flexDirection: 'column',
              bg: 'background',
              borderTop: '1px solid',
              borderColor: 'muted',
              height: '100%',
              '[data-vaul-handle]': {
                width: '100%',
                height: 'auto',
                background: 'transparent',
                opacity: 1,
              },
              '[data-vaul-handle-hitarea]': {
                position: 'static',
              },
            }}
          >
            <Drawer.Handle preventCycle>
              <Box
                sx={{
                  width: 32,
                  height: 5,
                  borderRadius: '1rem',
                  bg: 'secondary',
                  mx: 'auto',
                  my: 2,
                }}
                aria-hidden='true'
              />
              <Flex sx={{ flexDirection: 'column', gap: 3, px: 4 }}>
                <HazardSelector />
                <ClimateSelector />
                <TimePeriodSelector />
                <SidebarDivider sx={{ mt: 3, mb: 0 }} />
              </Flex>
            </Drawer.Handle>

            <Box
              ref={scrollContainerRef}
              sx={{
                px: 4,
                overflowY: 'auto',
                flex: 1,
                pb: snap === snapPoints[1] ? '48vh' : '6vh', // Bottom padding for scroll space
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <Flex
                sx={{
                  flexDirection: 'column',
                  flex: '1 1 auto',
                  justifyContent: 'space-between',
                  gap: 3,
                }}
              >
                <Box>
                  <Colorbar />
                  <Geocode />
                  <MapLayers />
                  <RegionalInfo />
                  <About />
                </Box>
                {advancedMode && <Display />}
                <Footer />
              </Flex>
            </Box>
          </Flex>
        </Drawer.Content>
      </Drawer.Root>
    </Box>
  )
}

export default MobileDrawer
