import { useEffect, useMemo } from 'react'
import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button, Row, Column } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Left } from '@carbonplan/icons'
import ScoreDetails from './score-details'
import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
import { getRiskScore } from '@/lib/risk-utils'

const AddressDetails = ({ onCollapse }: { onCollapse?: () => void }) => {
  const selectedLocation = useStore((state) => state.selectedLocation)
  const selectedCoordinates = useStore((state) => state.selectedCoordinates)
  const setSelectedLocation = useStore((state) => state.setSelectedLocation)
  const reverseGeocodeLoading = useStore((state) => state.reverseGeocodeLoading)
  const setReverseGeocodeLoading = useStore(
    (state) => state.setReverseGeocodeLoading,
  )
  const riskScore = useStore((state) =>
    getRiskScore(state.selectedBuilding, state.timePeriod),
  )

  useEffect(() => {
    if (selectedCoordinates && !selectedLocation) {
      const { lat, lng } = selectedCoordinates
      setReverseGeocodeLoading(true)
      const fetchLocation = async () => {
        try {
          const response = await fetch(
            `/api/geocode/reverse?lat=${lat}&lng=${lng}`,
          )
          if (response.ok) {
            const location = await response.json()
            setSelectedLocation(location)
          }
        } catch (error) {
          console.error('Error fetching location details:', error)
        } finally {
          setReverseGeocodeLoading(false)
        }
      }
      fetchLocation()
    }
  }, [
    selectedCoordinates,
    selectedLocation,
    setSelectedLocation,
    setReverseGeocodeLoading,
  ])

  const address = useMemo(() => {
    if (reverseGeocodeLoading) {
      return '-----------'
    }
    return selectedLocation?.address.houseNumber
      ? formatAddress(selectedLocation.address, true)
      : 'Selected building'
  }, [selectedLocation, reverseGeocodeLoading])

  if (!selectedCoordinates) {
    return null
  }

  if (riskScore === null) {
    return null
  }

  return (
    <Column start={1} width={4}>
      <Row columns={4}>
        {onCollapse && (
          <Column
            start={1}
            width={4}
            sx={{ mt: 2, mb: 3, pointerEvents: 'all' }}
          >
            <Button size='xs' inverted prefix={<Left />} onClick={onCollapse}>
              Collapse
            </Button>
          </Column>
        )}
        <Column
          start={1}
          width={4}
          as='h2'
          sx={{
            display: ['none', 'none', 'block'],
            fontSize: [5, 5, 5, 6],
            fontFamily: 'heading',
            letterSpacing: 'heading',
            lineHeight: 'heading',
            my: 3,
          }}
        >
          {address}
        </Column>
        <Column start={1} width={4} variant='labelFieldContainer'>
          <Box variant='sectionHeading'>About this score</Box>
          <ScoreDetails />
        </Column>
      </Row>
    </Column>
  )
}

export default AddressDetails
