import { Box, Button, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column, Link } from '@carbonplan/components'

const Agreement = ({ onClick }: { onClick: () => void }) => {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'background',
          opacity: 0.75,
          pointerEvents: 'all',
        }}
      />
      <Row>
        <Column
          start={6}
          width={3}
          sx={{ position: 'relative', mx: [-4, -5, -5, -6] }}
        >
          <Box
            sx={{
              pointerEvents: 'all',
              position: 'absolute',
              zIndex: 2,
              width: '100%',
              backgroundColor: 'background',
              mt: '30vh',
              borderColor: 'muted',
              borderStyle: 'solid',
              borderWidth: 1,
              px: [4, 5, 5, 6],
              py: [4, 5, 5, 6],
            }}
          >
            <Flex
              sx={{
                flexDirection: 'column',
                alignItems: 'center',
                gap: [4, 5, 5, 6],
              }}
            >
              <Box>
                By viewing Open Climate Risk, I agree to CarbonPlan’s 
                <Link href='https://carbonplan.org/terms'>Terms of Use</Link>
                 and 
                <Link href='https://carbonplan.org/privacy'>
                  Privacy Policy
                </Link>
                .
              </Box>
              <Button
                onClick={onClick}
                sx={{
                  cursor: 'pointer',
                  width: 'fit-content',
                  backgroundColor: 'hinted',
                  fontFamily: 'mono',
                  letterSpacing: 'mono',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                  minHeight: '24px',
                  borderRadius: '12px',
                  px: 2,
                  py: 0,
                  gap: 1,
                  fontSize: [0, 0, 1, 1],
                  border: `1px solid`,
                  borderColor: 'secondary',
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: 'secondary',
                  },
                }}
              >
                Accept
              </Button>
            </Flex>
          </Box>
        </Column>
      </Row>
    </>
  )
}

export default Agreement
