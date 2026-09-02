import { Box } from 'theme-ui'
import {
  Filter,
  Row,
  Column,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

import { useStore } from '@/lib/store'
import TooltipWrapper from './tooltip'

const ClimateSelector = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const setTimePeriod = useStore((state) => state.setTimePeriod)
  const climateTooltip = useStore((state) => state.riskConfig.climateTooltip)
  const hazardId = useStore((state) => state.riskConfig.id)

  const hasFutureClimate = useStore(
    (state) => !!state.riskConfig.datasets.future,
  )

  return (
    <Row columns={[6, 8, 4, 4]}>
      <Column start={[1]} width={1}>
        <Box variant='label'>Climate</Box>
      </Column>
      <Column start={[3, 2, 2, 2]} width={[4, 7, 3, 3]} sx={{ mb: '-5px' }}>
        <TooltipWrapper
          tooltip={climateTooltip}
          sx={{ justifyContent: 'flex-start', gap: 3 }}
        >
          <Filter
            key={hazardId}
            role='group'
            aria-label='Select climate period'
            variant='filter'
            values={{
              current: timePeriod === 'current',
              ...(hasFutureClimate ? { future: timePeriod === 'future' } : {}),
            }}
            labels={{ current: 'Current', future: 'Future' }}
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
            sx={hasFutureClimate ? {} : { mr: -2 }} // Filter always adds `mr` to each Tag, even when only 1 is rendered
          />
        </TooltipWrapper>
      </Column>
    </Row>
  )
}

export default ClimateSelector
