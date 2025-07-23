import { Box, Flex } from 'theme-ui'

//@ts-expect-error - carbonplan layouts types not available
import { SidebarAttachment } from '@carbonplan/layouts'
//@ts-expect-error - carbonplan components types not available
import { Row } from '@carbonplan/components'
import { ReactNode } from 'react'

const SIDEBAR_WIDTH = 4
const SIDECAR_WIDTH = 4
const OFFSET = SIDEBAR_WIDTH + SIDECAR_WIDTH

const SidebarSidecar = ({
  visible,
  children,
}: {
  visible: boolean
  children: ReactNode
}) => {
  const offset = visible ? OFFSET : 1
  return (
    <SidebarAttachment
      expanded={visible}
      side='left'
      width={4}
      sx={{
        right: [
          `calc(${6 - offset} * (100vw - 7 * 24px) / 6 + ${12 - offset} * 24px)`,
          `calc(${8 - offset} * (100vw - 9 * 32px) / 8 + ${12 - offset} * 32px)`,
          `calc(${12 - offset} * (100vw - 13 * 32px) / 12 + ${12 - offset} * 32px)`,
          `calc(${12 - offset} * (100vw - 13 * 48px) / 12 + ${12 - offset} * 48px)`,
        ],
        ...(visible
          ? {
              transform: 'translateX(0)',
              zIndex: 1,
            }
          : {
              transform: 'translateX(-100%)',
              zIndex: -1,
            }),
        transition: 'transform 0.2s',
        ml: ['-12px', '-16px', '-16px', '-24px'],
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
            columns={SIDECAR_WIDTH}
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
