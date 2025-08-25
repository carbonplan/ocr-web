import React from 'react'
import { Box } from 'theme-ui'
import {
  Badge,
  Link,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'

const ScoreBadge = ({ score, color }: { score: number; color: string }) => (
  <Badge
    sx={{ fontSize: [1, 1, 1, 2], height: [21, 21, 21, 22], mb: '-5px', color }}
  >
    {score.toFixed(2)}%
  </Badge>
)
const ScoreDetails = () => {
  const timeHorizon = useStore((state) => state.timeHorizon)
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

  const baseRiskScore = selectedBuilding.baseRisk[timePeriod][timeHorizon]
  const score = selectedBuilding.windRisk[timePeriod][timeHorizon]
  const baseScoreColor = getColorForRiskScore(
    baseRiskScore,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )
  const scoreColor = getColorForRiskScore(
    score,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )

  const getRiskScoreDeltaWording = () => {
    if (baseRiskScore === null || score === null) {
      return null
    }

    const scoreDifference = score - baseRiskScore

    if (scoreDifference > 0.01) {
      return (
        <>
          increasing the risk to <ScoreBadge score={score} color={scoreColor} />
          .
        </>
      )
    } else if (scoreDifference < -0.01) {
      return (
        <>
          decreasing the risk to <ScoreBadge score={score} color={scoreColor} />
          .
        </>
      )
    } else {
      return <>which did not significantly change the risk.</>
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        The risk of structure loss at this address is is based on fire
        projections from the US Forest Service, similar to what underpins their
        Wildfire Risk to Communities dataset (
        <ScoreBadge score={baseRiskScore} color={baseScoreColor} />
        ). We adjusted our risk estimates by local wind directions during
        historical fire weather, mimicking how wildfire could spread into the
        built environment
        {timePeriod === 'future'
          ? ' and evaluated future climate change impacts,'
          : ','}{' '}
        {getRiskScoreDeltaWording()}
      </Box>
      <Box>
        Read our <Link href='#TK'>research methods</Link> for a detailed
        description.
      </Box>
    </Box>
  )
}

export default ScoreDetails
