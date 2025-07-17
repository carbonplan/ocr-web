import React from 'react'
import { Box } from 'theme-ui'
import {
  Badge,
  Link,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useLocationStore } from '@/store/location'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'

const badgeSx = {
  fontSize: [1, 1, 1, 2],
  height: [18, 18, 18, 22],
}

const renderScoreBadge = (score: number, color: string) => (
  <Badge sx={{ ...badgeSx, color }}>{score.toFixed(2)}%</Badge>
)

const ScoreDetails = () => {
  const timeHorizon = useLocationStore((state) => state.timeHorizon)
  const timePeriod = useLocationStore((state) => state.timePeriod)
  const selectedBuilding = useLocationStore((state) => state.selectedBuilding)
  const colorLimits = useLocationStore((state) => state.colorLimits)
  const riskConfig = useLocationStore((state) => state.riskConfig)

  const colormap = useColormap(riskConfig.colormap, {
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  if (!selectedBuilding) {
    return null
  }

  const baseRiskScore = selectedBuilding.baseRisk[timePeriod][timeHorizon]
  const windRiskScore = selectedBuilding.windRisk[timePeriod][timeHorizon]
  const baseScoreColor = getColorForRiskScore(
    baseRiskScore,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )
  const windScoreColor = getColorForRiskScore(
    windRiskScore,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )

  const getRiskScoreDeltaWording = () => {
    if (baseRiskScore === null || windRiskScore === null) {
      return null
    }

    const scoreDifference = windRiskScore - baseRiskScore

    if (scoreDifference > 0.01) {
      return (
        <>
          increases the burn probability to{' '}
          {renderScoreBadge(windRiskScore, windScoreColor)}.
        </>
      )
    } else if (scoreDifference < -0.01) {
      return (
        <>
          decreases the burn probability to{' '}
          {renderScoreBadge(windRiskScore, windScoreColor)}.
        </>
      )
    } else {
      return <>does not significantly change the burn probability.</>
    }
  }

  return (
    <Box sx={{ fontFamily: 'mono', fontSize: [1, 1, 1, 2], pt: 2 }}>
      <Box sx={{ mb: 2 }}>
        The risk score for this address is derived using the annual burn
        probability generated in the US Forest Service&apos;s Wildfire Risk to
        Communities dataset ({renderScoreBadge(baseRiskScore, baseScoreColor)}
        ). We then use historical wind data from fire weather days to predict
        how wildfire could spread, which {getRiskScoreDeltaWording()}
      </Box>
      <Box>
        Read our <Link href='#TK'>research methods</Link> for a detailed
        description.
      </Box>
    </Box>
  )
}

export default ScoreDetails
