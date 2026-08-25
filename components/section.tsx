import { ReactNode, useState } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Expander } from '@carbonplan/components'

//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'
import AnimateHeight from 'react-animate-height'

interface Props {
  label: string
  children: ReactNode
}

const Section = ({ label, children }: Props) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <Box sx={{ pt: 3 }}>
      <Flex
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: '.2s color',
          userSelect: 'none',
          '&:hover': { color: 'secondary' },
          '&:hover svg': { stroke: 'secondary' },
        }}
        as='label'
      >
        <Box variant='label'>{label}</Box>
        <Expander
          onClick={() => setExpanded(!expanded)}
          value={expanded}
          sx={{ stroke: 'primary', width: '10px', p: 0 }}
        />
      </Flex>

      <AnimateHeight
        duration={100}
        height={expanded ? 'auto' : 0}
        easing={'linear'}
      >
        {children}
      </AnimateHeight>
      <SidebarDivider sx={{ mt: 3 }} />
    </Box>
  )
}

export default Section
