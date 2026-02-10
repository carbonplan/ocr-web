import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
import { Geocode, Results, Display } from '@/components'
import { Drawer } from 'vaul'
import ClimateSelector from './climate-selector'

const MobileDrawer = () => {
  const snapPoints = useMemo(() => ['140px', 0.54, 0.94], [])

  const [snap, setSnap] = useState<number | string | null>(snapPoints[1])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const advancedMode = useStore((state) => state.advancedMode)

  useEffect(() => {
    if (selectedBuilding) {
      setSnap(snapPoints[1])
    }
  }, [selectedBuilding, setSnap, snapPoints])

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
        // scrollLockTimeout={1}
        // autoFocus={true} // fixes aria warning but weird to auto focus the geocoder
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
            }}
          >
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                bg: 'background',
                zIndex: 2,
              }}
            >
              <Box as={Drawer.Handle} sx={{ mt: 2 }} />
              <Box sx={{ px: 4 }}>
                <Geocode />
                <ClimateSelector />
              </Box>
            </Box>

            <Box
              ref={scrollContainerRef}
              sx={{
                px: 4,
                overflowY: 'auto',
                flex: 1,
                pb: snap === snapPoints[1] ? '48vh' : 6, // Bottom padding for scroll space
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <Results />
              {advancedMode && <Display />}
            </Box>
          </Flex>
        </Drawer.Content>
      </Drawer.Root>
    </Box>
  )
}

export default MobileDrawer
