import { Box } from 'theme-ui'

//@ts-expect-error - carbonplan components types not available
import { Badge, Button, Row, Column, Table } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { Left } from '@carbonplan/icons'

import ScoreDetails from './score-details'
import SidebarSidecar from './sidebar-sidecar'
import { useStore } from '@/lib/store'
import { formatAddress } from '@/lib/address-utils'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'
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
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)

  const colormap = useColormap(riskConfig.colormap, {
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  const scoreColor = getColorForRiskScore(
    riskScore,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
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
            The risk described above does not account for a variety of factors
            that each may drive the actual risk of destruction due to fire up or
            down.
            <Table
              columns={[4]}
              start={[[1], [4]]}
              width={[[3], [1]]}
              data={[
                [
                  'Building retrofit',
                  <Badge
                    key='lower'
                    sx={{ textTransform: 'uppercase', color: scoreColor }}
                  >
                    Lower
                  </Badge>,
                ],
                [
                  'Community emergency response',
                  <Badge
                    key='lower'
                    sx={{ textTransform: 'uppercase', color: scoreColor }}
                  >
                    Lower
                  </Badge>,
                ],
                [
                  'Previous fire',
                  <Badge
                    key='lower'
                    sx={{ textTransform: 'uppercase', color: scoreColor }}
                  >
                    Lower
                  </Badge>,
                ],
                [
                  'Access limitations',
                  <Badge
                    key='higher'
                    sx={{ textTransform: 'uppercase', color: scoreColor }}
                  >
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
                score={riskScore}
                data={censusTractData}
              />
            </Column>
          )}
        </Row>
      </Column>
    </SidebarSidecar>
  )
}

export default AddressDetails
