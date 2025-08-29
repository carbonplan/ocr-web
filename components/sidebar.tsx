import { Spinner } from 'theme-ui'
import { useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar, SidebarAttachment } from '@carbonplan/layouts'
import { Display, Geocode, Results } from '../components'
import { AddressDetails, SidebarSidecar } from './address-details'
import Intro from './intro'

const SidebarComponent = () => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const isLoading = useStore(
    (state) => state.mapLoading || state.reverseGeocodeLoading,
  )
  const map = useStore((state) => state.map)
  const setSidebarWidth = useStore((state) => state.setSidebarWidth)
  const showAddressDetails = useStore((state) => state.showAddressDetails)
  const setShowAddressDetails = useStore((state) => state.setShowAddressDetails)

  useEffect(() => {
    const updateSidebarWidth = () => {
      if (sidebarRef.current) {
        const width =
          sidebarRef.current.parentElement?.parentElement?.offsetWidth
        if (width) {
          setSidebarWidth(width)
          map?.resize()
        }
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
    <>
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
    </>
  )
}

export default SidebarComponent
