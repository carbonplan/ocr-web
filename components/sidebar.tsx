import { Box, Spinner } from 'theme-ui'
import { useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar, SidebarAttachment } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan components types not available
import { Link } from '@carbonplan/components'
import { Display, Geocode, Results } from '../components'
import AddressDetails from './address-details'

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
    }
  }, [setSidebarWidth, map])

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
            risks. Use the map to explore risk data at address, county, and
            census tract levels. Read our <Link href='#TK'>methods</Link>, the{' '}
            <Link href='#TK'>FAQs</Link>, or{' '}
            <Link href='#TK'>download the data</Link> for more details.
          </Box>
          <Geocode />
          <Results />
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
