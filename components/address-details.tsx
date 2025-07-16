import { Box, Flex } from 'theme-ui'

//@ts-expect-error - carbonplan layouts types not available
import { SidebarAttachment } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan components types not available
import { Row, Column } from '@carbonplan/components'
import ScoreDetails from './score-details'

const AddressDetails = () => {
  return (
    <SidebarAttachment
      expanded
      side='left'
      width={4}
      sx={{
        right: [
          `calc(${6 - 8} * (100vw - 7 * 24px) / 6 + ${12 - 8} * 24px)`,
          `calc(${8 - 8} * (100vw - 9 * 32px) / 8 + ${12 - 8} * 32px)`,
          `calc(${12 - 8} * (100vw - 13 * 32px) / 12 + ${12 - 8} * 32px)`,
          `calc(${12 - 8} * (100vw - 13 * 48px) / 12 + ${12 - 8} * 48px)`,
        ],
        ml: '-16px',
      }}
    >
      <Flex
        sx={{
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: 'background',
          borderRight: ({ colors }) => `1px solid ${colors?.muted}`,
        }}
      >
        <Box
          sx={{
            flex: '1 1 auto',
            overflow: 'hidden',
            bg: 'transparent',
            px: [4, 5, 5, 6],
          }}
        >
          <Row
            columns={4}
            sx={{
              flex: '0 0 auto',
              height: '100%',
              overflowX: 'hidden',
              overflowY: 'scroll',
              py: [4],
              px: [4, 5, 5, 6],
              mx: [-4, -5, -5, -6],
            }}
          >
            <Column start={1} width={4} variant='labelFieldContainer'>
              <Row columns={4}>
                <Column start={1} width={4} variant='labelFieldContainer'>
                  <Box variant='sectionHeading'>About this score</Box>
                  <ScoreDetails />
                </Column>
                <Column start={1} width={4} variant='labelFieldContainer'>
                  <Box variant='sectionHeading'>Other factors</Box>
                  <Box
                    sx={{ fontFamily: 'mono', fontSize: [1, 1, 1, 2], pt: 2 }}
                  >
                    The risk score described above does not account for a
                    variety of factors that each may drive actual fire risk up
                    or down.
                  </Box>
                </Column>
                <Column start={1} width={4} variant='labelFieldContainer'>
                  <Box variant='sectionHeading'>Summary statistics</Box>
                  <Box
                    sx={{ fontFamily: 'mono', fontSize: [1, 1, 1, 2], pt: 2 }}
                  >
                    TK
                  </Box>
                </Column>
              </Row>
            </Column>
          </Row>
        </Box>
      </Flex>
    </SidebarAttachment>
  )
}

export default AddressDetails
