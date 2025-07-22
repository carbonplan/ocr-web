import { Box, Spinner } from 'theme-ui'
import { useRef, useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar, SidebarAttachment } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'
import { Display, Geocode, Results } from '../components'
import AddressDetails from './address-details'

const SidebarComponent = () => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [showAddressDetails, setShowAddressDetails] = useState<boolean>(false)
  const mapLoading = useStore((state) => state.mapLoading)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const setSidebarWidth = useStore((state) => state.setSidebarWidth)

  useEffect(() => {
    if (selectedBuilding) {
      setShowAddressDetails(true)
    }
  }, [selectedBuilding])

  useEffect(() => {
    const updateSidebarWidth = () => {
      if (sidebarRef.current) {
        const width = sidebarRef.current.offsetWidth
        setSidebarWidth(width)
      }
    }

    updateSidebarWidth()

    window.addEventListener('resize', updateSidebarWidth)

    return () => {
      window.removeEventListener('resize', updateSidebarWidth)
    }
  }, [setSidebarWidth])

  return (
    <>
      <Sidebar expanded={true} side='left' width={4}>
        <div ref={sidebarRef}>
          <Box
            as='h1'
            sx={{
              fontSize: [5, 5, 5, 6],
              fontFamily: 'heading',
              letterSpacing: 'heading',
              lineHeight: 'heading',
              mb: 3,
            }}
          >
            Open Climate Risks
          </Box>
          <Box sx={{ mb: 3 }}>
            This explorer lets you browse datasets containing different climate
            risks. Use the map to explore risk data at address, census block,
            and census tract levels. Read our <Link href='#TK'>methods</Link>,
            the <Link href='#TK'>FAQs</Link>, or{' '}
            <Link href='#TK'>analysis examples</Link> for more details.
          </Box>
          <Geocode />
          <Results
            showAddressDetails={showAddressDetails}
            setShowAddressDetails={setShowAddressDetails}
          />
          <Display />
        </div>
      </Sidebar>
      <AddressDetails
        visible={showAddressDetails}
        onCollapse={() => setShowAddressDetails(false)}
      />
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
