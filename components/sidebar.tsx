import { Box } from 'theme-ui'
import { useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar } from '@carbonplan/layouts'
import { Display, Geocode, Results } from '../components'
import Intro from './intro'
import RiskSelector from './risk-selector'
import { StickyStack } from './sticky-stack'
import LayerSelector from './layer-selector'
import ClimateSelector from './climate-selector'

const SidebarComponent = () => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const map = useStore((state) => state.map)
  const setSidebarWidth = useStore((state) => state.setSidebarWidth)
  const advancedMode = useStore((state) => state.advancedMode)

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
        <div ref={sidebarRef}>
          <Intro />
          <StickyStack>
            <Geocode />
            <RiskSelector />
            <LayerSelector />
            <ClimateSelector />
          </StickyStack>
          <Results />
          {advancedMode && <Display />}
        </div>
      </Sidebar>
    </Box>
  )
}

export default SidebarComponent
