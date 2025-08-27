import { useState, useEffect, useMemo } from 'react'
import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan components types not available
import { Button } from '@carbonplan/components'
import { Geocode, Results, Display, Intro } from '@/components'
import { AddressDetails } from './address-details'
import { Drawer } from 'vaul'

const BuildingPlaceholder = () => (
  <Box
    sx={{
      color: 'secondary',
    }}
  >
    <Box
      sx={{
        fontSize: 3,
        fontFamily: 'heading',
        letterSpacing: 'heading',
        mb: 2,
      }}
    >
      No building selected
    </Box>
    <Box sx={{ fontSize: 2 }}>
      Select a building on the map or search for an address to view detailed
      risk information.
    </Box>
  </Box>
)

const MobileDrawer = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const snapPoints = useMemo(() => ['90px', 0.54, 0.94], [])
  const [currentView, setCurrentView] = useState<'main' | 'details'>('main')
  const [snap, setSnap] = useState<number | string | null>(snapPoints[1])

  useEffect(() => {
    if (selectedBuilding) {
      setCurrentView('details')
      setSnap(snapPoints[1])
    }
  }, [selectedBuilding, setSnap, snapPoints])

  return (
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
      <Drawer.Portal>
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
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
                zIndex: 1,
              }}
            >
              <Box as={Drawer.Handle} sx={{ mt: 2 }} />
              <Box sx={{ px: 4, pb: 2 }}>
                <Geocode />
              </Box>
            </Box>

            <Box
              sx={{
                px: 4,
                overflowY: 'auto',
                flex: 1,
                pb: '50vh', // Bottom padding for scroll space
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <Flex
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'muted',
                  flexShrink: 0,
                  mb: 3,
                }}
              >
                <Button
                  size='sm'
                  onClick={() => setCurrentView('main')}
                  sx={{
                    flex: 1,
                    borderRadius: 0,
                    borderBottom: currentView === 'main' ? '2px solid' : 'none',
                    borderBottomColor: 'primary',
                    py: 1,
                  }}
                >
                  Settings
                </Button>
                <Button
                  size='sm'
                  onClick={() => setCurrentView('details')}
                  sx={{
                    flex: 1,
                    borderRadius: 0,
                    borderBottom:
                      currentView === 'details' ? '2px solid' : 'none',
                    borderBottomColor: 'primary',
                    py: 1,
                  }}
                >
                  Details
                </Button>
              </Flex>

              {currentView === 'main' ? (
                <>
                  <Intro />
                  <Results />
                  <Display />
                </>
              ) : selectedBuilding ? (
                <AddressDetails />
              ) : (
                <BuildingPlaceholder />
              )}
            </Box>
          </Flex>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default MobileDrawer
