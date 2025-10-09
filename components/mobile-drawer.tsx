import { useState, useEffect, useMemo, useRef } from 'react'
import { Box, Flex } from 'theme-ui'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan components types not available
import { Badge } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Search } from '@carbonplan/icons'
import { Geocode, Results, Display } from '@/components'
import { Drawer } from 'vaul'
import { getColorForRiskScore, useColormap } from '@/lib/colormaps'
import { getRiskScore } from '@/lib/risk-utils'

const MobileDrawer = () => {
  // weird bug, adding two extra final snap points fixes drawer not following drag in all cases.
  const snapPoints = useMemo(() => ['135px', 0.54, 0.94, 0.94, 0.94], [])

  const [snap, setSnap] = useState<number | string | null>(snapPoints[1])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const riskConfig = useStore((state) => state.riskConfig)
  const colorLimits = useStore((state) => state.colorLimits)
  const score = useStore((state) =>
    getRiskScore(state.selectedBuilding, state.timePeriod),
  )
  const colormap = useColormap(riskConfig.colormap, {
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })
  const scoreColor = getColorForRiskScore(
    score,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )

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
                      <Badge sx={{ color: scoreColor }}>
                        {score.toFixed(2)}%
                      </Badge>
                    ) : (
                      <Search />
                    )
                  }
                />
              </Box>
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
              <Results />
              <Display />
            </Box>
          </Flex>
        </Drawer.Content>
      </Drawer.Root>
    </Box>
  )
}

export default MobileDrawer
