import { Box } from 'theme-ui'
import {
  Filter,
  Row,
  Column,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

//@ts-expect-error - carbonplan layouts types not available
import { SidebarDivider } from '@carbonplan/layouts'

import { useStore } from '@/lib/store'
import { useStickyBlock } from './sticky-stack'
import { RISKS, HAZARD_IDS, isHazardId } from '@/lib/hazards'
import TooltipWrapper from './tooltip'

const RiskSelector = () => {
  const hazard = useStore((state) => state.hazard)
  const setHazard = useStore((state) => state.setHazard)
  const description = useStore((state) => state.riskConfig.description)
  const { ref: stickyRef, sx: stickySx } = useStickyBlock(1)

  return (
    <Box ref={stickyRef} sx={{ width: '100%', ...stickySx }}>
      <Box
        sx={{
          background: 'background',
          px: [4, 5, 5, 6],
          mx: [-4, -5, -5, -6],
          pt: 3,
        }}
      >
        <Row columns={[6, 8, 4, 4]}>
          <Column start={[1]} width={1}>
            <Box variant='label'>Hazard</Box>
          </Column>
          <Column start={[3, 2, 2, 2]} width={[4, 7, 3, 3]} sx={{ mb: '-5px' }}>
            <TooltipWrapper
              tooltip={description}
              sx={{ justifyContent: 'flex-start', gap: 3 }}
            >
              <Filter
                role='group'
                aria-label='Select risk type'
                variant='filter'
                values={Object.fromEntries(
                  HAZARD_IDS.map((id) => [id, id === hazard]),
                )}
                labels={Object.fromEntries(
                  HAZARD_IDS.map((id) => [id, RISKS[id].label]),
                )}
                colors={Object.fromEntries(
                  HAZARD_IDS.map((id) => [id, RISKS[id].accentColor]),
                )}
                setValues={(values: Record<string, boolean>) => {
                  const selected = Object.keys(values).find(
                    (key) => values[key],
                  )
                  if (selected && isHazardId(selected)) {
                    setHazard(selected)
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

export default RiskSelector
