import { ReactNode } from 'react'
import { Box, Flex } from 'theme-ui'
import { mix } from '@theme-ui/color'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'

// tucks under the sidebar's top padding before pinning
const BASE_TOP = -100
const BASE_Z = 10

export const StickyStack = ({ children }: { children: ReactNode }) => {
  return (
    <Box
      sx={{
        mt: -4,
        pt: 4,
        px: [4, 5, 5, 6],
        mx: [-4, -5, -5, -6],
        background: 'background',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        position: 'sticky',
        top: BASE_TOP,
        zIndex: BASE_Z,
        '&:hover': {
          background: mix('muted', 'background', 0.25),
        },
      }}
    >
      <Flex sx={{ flexDirection: 'column', gap: 3 }}>{children}</Flex>
      <SidebarDivider sx={{ mt: 3, mb: 0 }} />
    </Box>
  )
}
