import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import { Geocode, Results, HistoricResults, Display } from '@/components'
import { Drawer } from 'vaul'
import ClimateSelector from './climate-selector'

const MobileDrawer = () => {
  // weird bug, adding two extra final snap points fixes drawer not following drag in all cases.
  const snapPoints = useMemo(() => ['140px', 0.54, 0.94, 0.94, 0.94], [])

  const [snap, setSnap] = useState<number | string | null>(snapPoints[1])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedFires = useStore((state) => state.selectedFires)
  const advancedMode = useStore((state) => state.advancedMode)
  const historicMode = useStore((state) => state.historicMode)

  useEffect(() => {
    // Reveal the drawer when a building (or, in historic mode, a fire) is
    // selected, so the newly selected details aren't hidden behind a low snap.
    if (selectedBuilding || (selectedFires && selectedFires.length > 0)) {
      setSnap(snapPoints[1])
    }
  }, [selectedBuilding, selectedFires, setSnap, snapPoints])

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
              <Box sx={{ px: 4 }}>
                <Geocode />
                <ClimateSelector />
              </Box>
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
              {historicMode ? <HistoricResults /> : <Results />}
              {advancedMode && <Display />}
            </Box>
          </Flex>
        </Drawer.Content>
      </Drawer.Root>
    </Box>
  )
}

export default MobileDrawer
