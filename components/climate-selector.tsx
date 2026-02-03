import { Box } from 'theme-ui'
import { mix } from '@theme-ui/color'
import {
  Filter,
  Row,
  Column,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'

import { useStore } from '@/lib/store'
import TooltipWrapper from './tooltip'

const ClimateSelector = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const setTimePeriod = useStore((state) => state.setTimePeriod)

  return (
    <Box
      sx={{ width: '100%', position: 'sticky', top: -25 + 55.59, zIndex: 9 }}
    >
      <Box
        sx={{
          background: 'background',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          px: [4, 5, 5, 6],
          mx: [-4, -5, -5, -6],
          pt: 3,
          '&:hover': {
            background: mix('muted', 'background', 0.25),
          },
        }}
      >
        <Row columns={[6, 8, 4, 4]}>
          <Column start={[1]} width={1}>
            <Box variant='label'>Climate</Box>
          </Column>
          <Column start={[3, 2, 2, 2]} width={[4, 7, 3, 3]} sx={{ mb: '-5px' }}>
            <TooltipWrapper
              tooltip='Current risk estimates are based on a climate circa 2004-2018, while future estimates use a climate representative of 2040-2054. Both estimates use vegetation from the early 2020s.'
              sx={{ justifyContent: 'flex-start', gap: 3 }}
            >
              <Filter
                role='group'
                aria-label='Select climate period'
                variant='filter'
                values={{
                  current: timePeriod === 'current',
                  future: timePeriod === 'future',
                }}
                labels={{
                  current: 'Current',
                  future: 'Future',
                }}
                setValues={(values: Record<string, boolean>) => {
                  const selectedPeriod = Object.keys(values).find(
                    (key) => values[key],
                  )
                  if (selectedPeriod === 'current') {
                    setTimePeriod('current')
                  } else if (selectedPeriod === 'future') {
                    setTimePeriod('future')
                  }
                }}
              />
            </TooltipWrapper>
          </Column>
        </Row>
        <SidebarDivider sx={{ mt: 3, mb: 0 }} />
      </Box>
    </Box>
  )
}

export default ClimateSelector
