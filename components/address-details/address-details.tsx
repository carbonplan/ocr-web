import { Box } from 'theme-ui'

//@ts-expect-error - carbonplan components types not available
import { Button, Row, Column } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Left } from '@carbonplan/icons'

import ScoreDetails from './score-details'
import SidebarSidecar from './sidebar-sidecar'
import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
import Histogram from './histogram'

const AddressDetails = ({
  visible,
  onCollapse,
}: {
  visible: boolean
  onCollapse: () => void
}) => {
  const selectedLocation = useStore((state) => state.selectedLocation)
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

  if (!selectedLocation?.address.houseNumber) {
    return null
  }

  if (riskScore === null) {
    return null
  }

  const address = formatAddress(selectedLocation.address, true)

  return (
    <SidebarSidecar visible={visible}>
      <Column start={1} width={4}>
        <Row columns={4}>
          <Column start={1} width={4} sx={{ mt: 2, mb: 3, pointEvents: 'all' }}>
            <Button size='xs' inverted prefix={<Left />} onClick={onCollapse}>
              Collapse
            </Button>
          </Column>
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
          {countyData && (
            <Column start={1} width={4} variant='labelFieldContainer'>
              <Box variant='sectionHeading'>Summary statistics</Box>
              <Box sx={{ fontFamily: 'mono', fontSize: [1, 1, 1, 2], pt: 2 }}>
                <Histogram
                  address={address}
                  region={`${countyName} County`}
                  score={riskScore}
                  data={countyData}
                />
              </Box>
            </Column>
          )}
          {censusTractData && (
            <Column start={1} width={4}>
              <Box sx={{ fontFamily: 'mono', fontSize: [1, 1, 1, 2], pt: 2 }}>
                <Histogram
                  address={address}
                  region={'the census tract'}
                  score={riskScore}
                  data={censusTractData}
                />
              </Box>
            </Column>
          )}
        </Row>
      </Column>
    </SidebarSidecar>
  )
}

export default AddressDetails
