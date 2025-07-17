import { Box } from 'theme-ui'

//@ts-expect-error - carbonplan components types not available
import { Row, Column } from '@carbonplan/components'
import ScoreDetails from './score-details'
import SidebarSidecar from './sidebar-sidecar'
import { useLocationStore } from '@/store/location'

const AddressDetails = () => {
  const selectedBuilding = useLocationStore((state) => state.selectedBuilding)

  if (!selectedBuilding) {
    return null
  }

  return (
    <SidebarSidecar>
      <Column start={1} width={4} variant='labelFieldContainer'>
        <Row columns={4}>
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
              TK
            </Box>
          </Column>
        </Row>
      </Column>
    </SidebarSidecar>
  )
}

export default AddressDetails
