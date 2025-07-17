import { Box } from 'theme-ui'

//@ts-expect-error - carbonplan components types not available
import { Row, Column } from '@carbonplan/components'
import ScoreDetails from './score-details'
import SidebarSidecar from './sidebar-sidecar'
import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
import Histogram from './histogram'

const AddressDetails = () => {
  const selectedLocation = useStore((state) => state.selectedLocation)
  const riskScore = useStore(
    ({ selectedBuilding, attribute, timePeriod, timeHorizon }) =>
      selectedBuilding
        ? selectedBuilding[attribute][timePeriod][timeHorizon]
        : null,
  )

  if (!selectedLocation?.address.houseNumber) {
    return null
  }

  if (riskScore === null) {
    return null
  }

  const address = formatAddress(selectedLocation.address, true)

  return (
    <SidebarSidecar>
      <Column start={1} width={4}>
        <Row columns={4}>
          <Column
            start={1}
            width={4}
            as='h2'
            sx={{
              fontSize: [5, 5, 5, 6],
              fontFamily: 'heading',
              letterSpacing: 'heading',
              lineHeight: 'heading',
              my: 3,
            }}
          >
            {formatAddress(selectedLocation.address, true)}
          </Column>
          <Column start={1} width={4} variant='labelFieldContainer'>
            <Box variant='sectionHeading'>About this score</Box>
            <ScoreDetails />
          </Column>
          <Column start={1} width={4} variant='labelFieldContainer'>
            <Box variant='sectionHeading'>Other factors</Box>
            <Box sx={{ fontFamily: 'mono', fontSize: [1, 1, 1, 2], pt: 2 }}>
              The risk score described above does not account for a variety of
              factors that each may drive actual fire risk up or down.
            </Box>
          </Column>
          <Column start={1} width={4} variant='labelFieldContainer'>
            <Box variant='sectionHeading'>Summary statistics</Box>
            <Box sx={{ fontFamily: 'mono', fontSize: [1, 1, 1, 2], pt: 2 }}>
              <Histogram
                address={address}
                region={`${selectedLocation.address.county} County`}
                score={riskScore}
              />
            </Box>
          </Column>
        </Row>
      </Column>
    </SidebarSidecar>
  )
}

export default AddressDetails
