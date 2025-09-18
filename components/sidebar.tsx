import { Box } from 'theme-ui'
import { useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar } from '@carbonplan/layouts'
import { Display, Geocode, Results } from '../components'
import { AddressDetails, SidebarSidecar } from './address-details'
import Intro from './intro'

const SidebarComponent = () => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const map = useStore((state) => state.map)
  const setSidebarWidth = useStore((state) => state.setSidebarWidth)
  const showAddressDetails = useStore((state) => state.showAddressDetails)
  const setShowAddressDetails = useStore((state) => state.setShowAddressDetails)

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
          <Geocode />
          <Results />
          <Display />
        </div>
      </Sidebar>

      <SidebarSidecar visible={showAddressDetails}>
        <AddressDetails onCollapse={() => setShowAddressDetails(false)} />
      </SidebarSidecar>
    </Box>
  )
}

export default SidebarComponent
