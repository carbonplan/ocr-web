import { Box, Flex } from 'theme-ui'
import { useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar } from '@carbonplan/layouts'
import {
  ClimateSelector,
  HazardSelector,
  TimePeriodSelector,
  Colorbar,
  RegionalInfo,
  About,
  Footer,
  Geocode,
  MapLayers,
} from '@/components'
import { StickyStack } from './sticky-stack'

const SidebarComponent = () => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const map = useStore((state) => state.map)
  const setSidebarWidth = useStore((state) => state.setSidebarWidth)

  useEffect(() => {
    const updateSidebarWidth = () => {
      if (sidebarRef.current) {
        const width =
          sidebarRef.current.parentElement?.parentElement?.offsetWidth ?? 0
        setSidebarWidth(width)
        map?.resize()
      }
    }
    updateSidebarWidth()
    window.addEventListener('resize', updateSidebarWidth)
    return () => {
      window.removeEventListener('resize', updateSidebarWidth)
      setSidebarWidth(0)
      map?.resize()
    }
  }, [setSidebarWidth, map])

  return (
    <Box sx={{ display: ['none', 'none', 'block'] }}>
      <Sidebar expanded={true} side='left' width={4}>
        <Box
          ref={sidebarRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
          }}
        >
          <StickyStack>
            <Box
              as='h1'
              sx={{
                fontSize: [4, 5, 5, 6],
                fontFamily: 'heading',
                letterSpacing: 'heading',
                lineHeight: 'heading',
                mb: 2,
              }}
            >
              Open Climate Risk
            </Box>
            <HazardSelector />
            <ClimateSelector />
            <TimePeriodSelector />
          </StickyStack>
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
            <Footer />
          </Flex>
        </Box>
      </Sidebar>
    </Box>
  )
}

export default SidebarComponent
