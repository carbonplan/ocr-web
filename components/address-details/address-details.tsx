import { useEffect, useMemo } from 'react'
import { Box } from 'theme-ui'

//@ts-expect-error - carbonplan components types not available
import { Badge, Button, Row, Column, Table } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Left } from '@carbonplan/icons'

import ScoreDetails from './score-details'
import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
import Histogram from './histogram'

const AddressDetails = ({ onCollapse }: { onCollapse?: () => void }) => {
  const selectedLocation = useStore((state) => state.selectedLocation)
  const selectedCoordinates = useStore((state) => state.selectedCoordinates)
  const setSelectedLocation = useStore((state) => state.setSelectedLocation)
  const reverseGeocodeLoading = useStore((state) => state.reverseGeocodeLoading)
  const setReverseGeocodeLoading = useStore(
    (state) => state.setReverseGeocodeLoading,
  )
  const riskScore = useStore(
    ({ selectedBuilding, attribute, timePeriod, timeHorizon }) =>
      selectedBuilding
        ? selectedBuilding[attribute][timePeriod][timeHorizon]
        : null,
  )
  const countyName = useStore((state) => state.activeGeographies.county?.name)
  const countyData = useStore(
    (state) =>
      state.activeGeographies.county?.risk[state.attribute][state.timePeriod][
        state.timeHorizon
      ].data,
  )
  const censusTractData = useStore(
    (state) =>
      state.activeGeographies.censusTract?.risk[state.attribute][
        state.timePeriod
      ][state.timeHorizon].data,
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
          <Column start={1} width={4} sx={{ mt: 2, mb: 3, pointEvents: 'all' }}>
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
        <Column start={1} width={4} variant='labelFieldContainer'>
          <Box variant='sectionHeading'>Other factors</Box>
          The risk described above does not account for a variety of factors
          that each may drive the actual risk of structure loss due to fire up
          or down.
          <Table
            columns={[4]}
            start={[[1], [4]]}
            width={[[3], [1]]}
            data={[
              [
                'Building retrofit',
                <Badge key='lower' sx={{ textTransform: 'uppercase' }}>
                  Lower
                </Badge>,
              ],
              [
                'Community emergency response',
                <Badge key='lower' sx={{ textTransform: 'uppercase' }}>
                  Lower
                </Badge>,
              ],
              [
                'Previous fire',
                <Badge key='lower' sx={{ textTransform: 'uppercase' }}>
                  Lower
                </Badge>,
              ],
              [
                'Access limitations',
                <Badge key='higher' sx={{ textTransform: 'uppercase' }}>
                  Higher
                </Badge>,
              ],
            ]}
            index={false}
            sx={{
              mt: 3,
              '& tr': {
                py: 2,
              },
              '& td': {
                fontFamily: 'mono',
                letterSpacing: 'mono',
                textTransform: 'uppercase',
                fontSize: [2, 2, 2, 3],
              },
            }}
          />
        </Column>
        {countyData && (
          <Column start={1} width={4} variant='labelFieldContainer'>
            <Box variant='sectionHeading'>Summary statistics</Box>
            <Histogram
              address={address}
              region={`${countyName} County`}
              geography='county'
              score={riskScore}
              data={countyData}
            />
          </Column>
        )}
        {censusTractData && (
          <Column start={1} width={4} sx={{ mt: 2 }}>
            <Histogram
              address={address}
              region={'the census tract'}
              geography='tract'
              score={riskScore}
              data={censusTractData}
            />
          </Column>
        )}
      </Row>
    </Column>
  )
}

export default AddressDetails
