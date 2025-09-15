import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan components types not available
import { Button, Badge } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Search } from '@carbonplan/icons'
import { Geocode, Results, Display } from '@/components'
import { AddressDetails } from './address-details'
import { Drawer } from 'vaul'
import { getColorForRiskScore, useColormap } from '@/lib/colormaps'

type TabKeys = 'settings' | 'risk'
interface TabsProps {
  activeTab: TabKeys
  onTabChange: (tab: TabKeys) => void
  tabs: Array<{ id: TabKeys; label: string }>
}

const Tabs = ({ activeTab, onTabChange, tabs }: TabsProps) => {
  return (
    <Flex sx={{ mt: -2 }}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          size='sm'
          onClick={() => onTabChange(tab.id)}
          variant='sectionHeading'
          sx={{
            fontFamily: 'heading',
            letterSpacing: 'smallcaps',
            fontSize: 2,
            flex: 1,
            height: '50px',
            textAlign: 'center',
            borderBottom: '1px solid',
            borderColor: 'muted',
            '&:not(:last-child)': {
              borderRight: '1px solid',
              borderColor: 'muted',
            },
            bg: activeTab === tab.id ? 'hinted' : 'background',
          }}
        >
          {tab.label}
        </Button>
      ))}
    </Flex>
  )
}

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
        my: 2,
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
  // weird bug, adding two extra final snap points fixes drawer not following drag in all cases.
  const snapPoints = useMemo(() => ['135px', 0.54, 0.94, 0.94, 0.94], [])

  const [currentView, setCurrentView] = useState<'settings' | 'risk'>(
    'settings',
  )
  const [snap, setSnap] = useState<number | string | null>(snapPoints[1])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const riskConfig = useStore((state) => state.riskConfig)
  const colorLimits = useStore((state) => state.colorLimits)
  const colormap = useColormap(riskConfig.colormap, {
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })
  const score = useStore(
    (state) =>
      state.selectedBuilding?.[state.attribute][state.timePeriod][
        state.timeHorizon
      ],
  )?.toFixed(2)

  const scoreColor = getColorForRiskScore(
    score ? parseFloat(score) : 0,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )

  useEffect(() => {
    if (selectedBuilding) {
      setCurrentView('risk')
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

  const handleViewChange = (view: 'settings' | 'risk') => {
    setCurrentView(view)
    if (snap === snapPoints[0]) {
      setSnap(snapPoints[1])
    }
  }

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
        <Drawer.Content
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            zIndex: 1,
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
              <Box sx={{ px: 4 }}>
                <Geocode
                  leftAccessory={
                    score != null ? (
                      <Badge sx={{ color: scoreColor }}>{score}%</Badge>
                    ) : (
                      <Search />
                    )
                  }
                />
              </Box>
              <Tabs
                activeTab={currentView}
                onTabChange={handleViewChange}
                tabs={[
                  { id: 'settings', label: 'Settings' },
                  { id: 'risk', label: 'Risk' },
                ]}
              />
            </Box>

            <Box
              ref={scrollContainerRef}
              sx={{
                px: 4,
                overflowY: 'auto',
                flex: 1,
                pb: '50vh', // Bottom padding for scroll space
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {currentView === 'settings' ? (
                <>
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
      </Drawer.Root>
    </Box>
  )
}

export default MobileDrawer
