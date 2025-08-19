import { Box, Spinner } from 'theme-ui'
import { useRef, useEffect, useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
//@ts-expect-error - carbonplan layouts types not available
import { Sidebar, SidebarAttachment } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan components types not available
import { Link, Button } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Right } from '@carbonplan/icons'
import { Display, Geocode, Results } from '../components'
import AddressDetails from './address-details'
import { LAYERS } from '@/lib/config'

const SidebarComponent = () => {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [showAddressDetails, setShowAddressDetails] = useState<boolean>(false)
  const mapLoading = useStore((state) => state.mapLoading)
  const map = useStore((state) => state.map)
  const mapZoom = useStore((state) => state.map?.getZoom())
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

  const downloadBuildingsAsGeoJSON = useCallback(() => {
    if (!map) {
      console.error('Map not available')
      return
    }

    try {
      const features = map.queryRenderedFeatures({
        layers: [LAYERS.buildings.layerIds.fill],
      })

      const geojson = {
        type: 'FeatureCollection' as const,
        features: features.map((feature) => ({
          type: 'Feature' as const,
          properties: feature.properties,
          geometry: feature.geometry,
        })),
      }

      const blob = new Blob([JSON.stringify(geojson, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `buildings_${new Date().toISOString().split('T')[0]}.geojson`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log(`Downloaded ${features.length} buildings as GeoJSON`)
    } catch (error) {
      console.error('Error downloading buildings:', error)
      alert('Error downloading buildings data')
    }
  }, [map])

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
          {mapZoom && mapZoom > 13 && (
            <Button
              onClick={downloadBuildingsAsGeoJSON}
              inverted
              size='xs'
              title='Download Visible Buildings (GeoJSON)'
              sx={{
                width: '100%',
                '&:hover': {
                  svg: {
                    transform: 'rotate(135deg)',
                  },
                },
              }}
              suffix={
                <Right
                  sx={{
                    transform: 'rotate(90deg)',
                  }}
                />
              }
            >
              Download Visible Buildings
            </Button>
          )}
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
