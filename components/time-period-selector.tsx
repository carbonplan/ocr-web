import {
  Filter,
  Row,
  Column,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'

import { useStore } from '@/lib/store'

const TimePeriodSelector = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const setFutureWindow = useStore((state) => state.setFutureWindow)
  const hazardId = useStore((state) => state.riskConfig.id)
  const timePeriodLabels = useStore(
    (state) => state.riskConfig.timePeriodLabels,
  )
  const hasMultipleTimePeriods =
    typeof timePeriodLabels[timePeriod] !== 'string'

  return (
    <Row columns={[6, 8, 4, 4]}>
      <Column start={[3, 2, 2, 2]} width={[4, 7, 3, 3]} sx={{ mb: '-5px' }}>
        <Filter
          key={`${hazardId}-${timePeriod}`}
          role='group'
          aria-label='Time period'
          values={
            hasMultipleTimePeriods
              ? {
                  fut1: futureWindow === 'fut1',
                  fut2: futureWindow === 'fut2',
                }
              : { [timePeriod]: true }
          }
          labels={
            hasMultipleTimePeriods
              ? timePeriodLabels[timePeriod]
              : { [timePeriod]: timePeriodLabels[timePeriod] }
          }
          setValues={(values: Record<string, boolean>) => {
            if (!hasMultipleTimePeriods) return

            const selected = Object.keys(values).find((key) => values[key])
            if (selected === 'fut1' || selected === 'fut2') {
              setFutureWindow(selected)
            }
          }}
        />
      </Column>
    </Row>
  )
}

export default TimePeriodSelector
