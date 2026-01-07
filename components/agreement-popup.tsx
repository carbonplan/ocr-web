import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column } from '@carbonplan/components'
import Agreement from './agreement'

const AgreementPopup = ({ onClick }: { onClick: () => void }) => {
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
      <Row sx={{ display: ['none', 'none', 'grid', 'grid'] }}>
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
            <Agreement onClick={onClick} />
          </Box>
        </Column>
      </Row>
    </>
  )
}

export default AgreementPopup
