import { Box } from 'theme-ui'
import {
  Filter,
  Row,
  Column,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

import { useStore } from '@/lib/store'
import { RISKS, HAZARD_IDS, isHazardId } from '@/lib/hazards'

const HazardSelector = () => {
  const hazard = useStore((state) => state.hazard)
  const setHazard = useStore((state) => state.setHazard)
  const description = useStore((state) => state.riskConfig.description)

  return (
    <Row columns={[6, 8, 4, 4]}>
      <Column start={[1]} width={1}>
        <Box variant='label'>Hazard</Box>
      </Column>
      <Column start={[3, 2, 2, 2]} width={[4, 7, 3, 3]} sx={{ mb: '-5px' }}>
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
            const selected = Object.keys(values).find((key) => values[key])
            if (selected && isHazardId(selected)) {
              setHazard(selected)
            }
          }}
        />
        <Box sx={{ my: 1, fontSize: [1, 1, 1, 2] }}>{description}</Box>
      </Column>
    </Row>
  )
}

export default HazardSelector
