import { Box, Flex } from 'theme-ui'

//@ts-expect-error - carbonplan layouts types not available
import { SidebarAttachment } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan components types not available
import { Row } from '@carbonplan/components'
import { ReactNode } from 'react'

const SidebarSidecar = ({
  visible,
  children,
}: {
  visible: boolean
  children: ReactNode
}) => {
  return (
    <SidebarAttachment
      expanded={visible}
      sx={{
        mx: [
          'calc(33.333% + 32px)',
          'calc(33.333% + 32px)',
          'calc(33.333% + 20px)',
          'calc(33.333% + 32px)',
        ],
        transform: visible ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s',
        zIndex: 1,
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
            {children}
          </Row>
        </Box>
      </Flex>
    </SidebarAttachment>
  )
}

export default SidebarSidecar
