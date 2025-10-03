import React from 'react'
import { Box } from 'theme-ui'
import {
  Badge,
  Link,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'
import {
  getRiskScore,
  getBurnProbabilityUsfs,
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
} from '@/lib/risk-utils'

const ScoreBadge = ({ score, color }: { score: number; color?: string }) => (
  <Badge
    sx={{ fontSize: [1, 1, 1, 2], height: [21, 21, 21, 22], mb: '-5px', color }}
  >
    {score.toFixed(2)}%
  </Badge>
)
const ScoreDetails = () => {
  const timePeriod = useStore((state) => state.timePeriod)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const colorLimits = useStore((state) => state.colorLimits)
  const riskConfig = useStore((state) => state.riskConfig)

  const colormap = useColormap(riskConfig.colormap, {
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  if (!selectedBuilding) {
    return null
  }

  const usfsBurnProb = getBurnProbabilityUsfs(selectedBuilding, timePeriod)!
  const adjustedBurnProb = getAdjustedBurnProbability(
    selectedBuilding,
    timePeriod,
  )!
  const conditionalRisk = getConditionalRiskUsfs(selectedBuilding)!
  const windRisk = getRiskScore(selectedBuilding, timePeriod)!

  const windRiskColor = getColorForRiskScore(
    windRisk,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )

  const likelihoodDirection =
    adjustedBurnProb > usfsBurnProb ? 'increasing' : 'decreasing'

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        The risk of structure loss at this address is based on burn probability
        projections from the US Forest Service, similar to what underpins their
        Wildfire Risk to Communities dataset (
        <ScoreBadge score={usfsBurnProb} />
        ). We adjusted our burn probability estimates using local wind
        directions during historical fire weather, mimicking how wildfire could
        spread into the built environment, {likelihoodDirection} the probability
        to <ScoreBadge score={adjustedBurnProb} />
        . Combining this probability with a score of conditional risk (
        <ScoreBadge score={conditionalRisk} />) resulted in an overall risk
        score of <ScoreBadge score={windRisk} color={windRiskColor} />.
      </Box>
      <Box>
        Read our <Link href='#TK'>research methods</Link> for a detailed
        description.
      </Box>
    </Box>
  )
}

export default ScoreDetails
