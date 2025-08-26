import { Spinner } from 'theme-ui'
import { useRef, useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar, SidebarAttachment } from '@carbonplan/layouts'
import { Display, Geocode, Results } from '../components'
import { AddressDetails, SidebarSidecar } from './address-details'
import Intro from './intro'

const SidebarComponent = () => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [showAddressDetails, setShowAddressDetails] = useState<boolean>(false)
  const mapLoading = useStore((state) => state.mapLoading)
  const hasSelectedBuilding = useStore((state) => !!state.selectedBuilding)
  const houseNumber = useStore(
    (state) => state.selectedLocation?.address.houseNumber,
  )
  const setSidebarWidth = useStore((state) => state.setSidebarWidth)

  useEffect(() => {
    if (hasSelectedBuilding && houseNumber) {
      setShowAddressDetails(true)
      if (sidebarRef.current) {
        setSidebarWidth(sidebarRef.current.offsetWidth * 2)
      }
    } else if (sidebarRef.current) {
      setSidebarWidth(sidebarRef.current.offsetWidth)
    }
  }, [houseNumber, hasSelectedBuilding, setSidebarWidth])

  useEffect(() => {
    const updateSidebarWidth = () => {
      if (sidebarRef.current) {
        const width = sidebarRef.current.offsetWidth

        setSidebarWidth(showAddressDetails ? width * 2 : width)
      }
    }

    updateSidebarWidth()

    window.addEventListener('resize', updateSidebarWidth)

    return () => {
      window.removeEventListener('resize', updateSidebarWidth)
    }
  }, [setSidebarWidth, showAddressDetails])

  return (
    <>
      <Sidebar expanded={true} side='left' width={4}>
        <div ref={sidebarRef}>
          <Intro />
          <Geocode />
          <Results
            showAddressDetails={showAddressDetails}
            setShowAddressDetails={setShowAddressDetails}
          />
          <Display />
        </div>
      </Sidebar>

      <SidebarSidecar visible={showAddressDetails}>
        <AddressDetails onCollapse={() => setShowAddressDetails(false)} />
      </SidebarSidecar>

      {mapLoading && (
        <SidebarAttachment
          expanded={true}
          side='left'
          width={showAddressDetails ? 8 : 4}
          sx={{
            top: '16px',
          }}
        >
          <Spinner size={32} />
        </SidebarAttachment>
      )}
    </>
  )
}

export default SidebarComponent
