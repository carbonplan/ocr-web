import { Box } from 'theme-ui'
import Histogram from '../regional-info/histogram'
import { useStore } from '@/lib/store'
import { useShallow } from 'zustand/shallow'
import { getGeographyRisk } from '@/lib/risk-utils'
import { useScore } from '@/hooks/useScore'

const RiskCalculation = () => {
  const data = useStore(
    useShallow(
      (state) =>
        getGeographyRisk(state.activeGeographies.nation, state.timePeriod) ??
        [],
    ),
  )
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const { score: buildingScore } = useScore(selectedBuilding)

  return (
    <>
      <Box sx={{ mt: 2, variant: 'description' }}>
        The risk scoring system is a categorical classification of continuous
        values of annual risk of loss.
      </Box>
      <Box sx={{ mb: 6 }}>
        <Histogram
          region={'contiguous U.S.'}
          data={data}
          score={buildingScore}
          sx={data.length > 0 ? undefined : { opacity: 0.1 }}
        />
      </Box>
    </>
  )
}

export default RiskCalculation
