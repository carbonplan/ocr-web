import React, { useState, useEffect } from 'react'
import { Box } from 'theme-ui'
import AnimateHeight from 'react-animate-height'
import {
  Row,
  Column,
  Badge,
  Filter,
  Expander,
  Link,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useLocationStore } from '@/store/location'
import { RISKS } from '@/lib/config'
import { useColormap, getColorForRiskScore } from '@/lib/colormaps'

const Results = () => {
  const [aboutExpanded, setAboutExpanded] = useState(false)

  const timeHorizon = useLocationStore((state) => state.timeHorizon)
  const setTimeHorizon = useLocationStore((state) => state.setTimeHorizon)
  const timePeriod = useLocationStore((state) => state.timePeriod)
  const setTimePeriod = useLocationStore((state) => state.setTimePeriod)
  const selectedBuilding = useLocationStore((state) => state.selectedBuilding)
  const wind = useLocationStore((state) => state.wind)
  const colorLimits = useLocationStore((state) => state.colorLimits)
  const riskConfig = useLocationStore((state) => state.riskConfig)

  useEffect(() => {
    if (!wind && timePeriod === 'future') {
      setTimePeriod('current')
    }
  }, [wind, timePeriod, setTimePeriod])

  const colormap = useColormap(riskConfig.colormap, {
    count: colorLimits.type === 'discrete' ? 5 : 256,
  })

  const calculateRiskScores = (annualProbability: number) => {
    return {
      1: annualProbability * 100,
      15: (1 - Math.pow(1 - annualProbability, 15)) * 100,
      30: (1 - Math.pow(1 - annualProbability, 30)) * 100,
    }
  }

  const getRiskScoreForHorizon = (riskType: 'baseRisk' | 'windRisk') => {
    if (!selectedBuilding) return null

    const riskAttribute =
      riskType === 'baseRisk'
        ? RISKS.fire.attributes.baseRisk
        : RISKS.fire.attributes.windRisk[timePeriod]

    const riskValue = selectedBuilding[riskAttribute]
    if (!riskValue) return null

    const riskScores = calculateRiskScores(Number(riskValue))
    return riskScores[timeHorizon]
  }

  const baseRiskScore = getRiskScoreForHorizon('baseRisk')
  const windRiskScore = getRiskScoreForHorizon('windRisk')
  const mainRiskScore = wind ? windRiskScore : baseRiskScore

  const mainScoreColor = getColorForRiskScore(
    mainRiskScore,
    colormap,
    colorLimits,
    riskConfig.binRatios,
    'primary',
  )

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

  return (
    <>
      <Row columns={4} sx={{ my: 3, alignItems: 'baseline' }}>
        <Column start={1} width={1} variant='sectionHeading'>
          Results
        </Column>
        <Column start={2} width={3}>
          {!baseRiskScore && !windRiskScore && (
            <Box
              variant='field'
              sx={{ fontSize: 1, color: 'secondary', textTransform: 'none' }}
            >
              Select a structure
            </Box>
          )}
        </Column>
      </Row>
      <Row columns={4} variant='labelFieldContainer'>
        <Column start={1} width={1} variant='label'>
          Risk
        </Column>
        <Column start={2} width={3}>
          <Filter values={{ Fire: true }} colors={{ Fire: 'red' }} />
        </Column>
      </Row>
      <Row columns={4} variant='labelFieldContainer'>
        <Column start={1} width={1} variant='label'>
          Period
        </Column>
        <Column start={2} width={3}>
          {wind ? (
            <Filter
              key='wind-enabled'
              values={{
                current: timePeriod === 'current',
                future: timePeriod === 'future',
              }}
              labels={{
                current: 'Current',
                future: 'Future (2050)',
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
          ) : (
            <Filter
              key='wind-disabled'
              values={{ current: true }}
              setValues={() => {}}
            />
          )}
        </Column>
      </Row>
      <Row columns={4} variant='labelFieldContainer'>
        <Column start={1} width={1} variant='label'>
          Horizon
        </Column>
        <Column start={2} width={3}>
          <Filter
            values={{
              1: timeHorizon === 1,
              15: timeHorizon === 15,
              30: timeHorizon === 30,
            }}
            setValues={(values: Record<string, boolean>) => {
              const selectedTimeHorizon = Object.keys(values).find(
                (key) => values[key],
              )
              if (selectedTimeHorizon) {
                const horizon = Number(selectedTimeHorizon) as 1 | 15 | 30
                setTimeHorizon(horizon)
              }
            }}
            labels={{
              1: '01-Year',
              15: '15-Year',
              30: '30-Year',
            }}
          />
        </Column>
      </Row>
      <Row columns={4} variant='labelFieldContainer'>
        <Column start={1} width={1} variant='label' sx={{ textWrap: 'nowrap' }}>
          score
        </Column>
        <Column start={2} width={3} sx={{ height: 25 }}>
          <Badge sx={{ color: mainScoreColor }}>
            {mainRiskScore !== null ? `${mainRiskScore.toFixed(2)}%` : '---'}
          </Badge>
        </Column>
      </Row>
      <Row columns={4} variant='labelFieldContainer'>
        <Column
          start={1}
          width={4}
          variant='label'
          sx={{ display: 'flex', alignItems: 'center', gap: 2, height: 25 }}
        >
          About this score
          {selectedBuilding && (
            <Expander
              value={aboutExpanded}
              onClick={() => setAboutExpanded(!aboutExpanded)}
            />
          )}
        </Column>
        <Column start={1} width={4}>
          <AnimateHeight
            duration={300}
            height={
              aboutExpanded && (baseRiskScore || windRiskScore) ? 'auto' : 0
            }
          >
            {selectedBuilding && baseRiskScore && windRiskScore && (
              <Box sx={{ fontFamily: 'mono', fontSize: [1, 1, 1, 2], pt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  The risk score for this address is derived using the annual
                  burn probability generated in the US Forest Service&apos;s
                  Wildfire Risk to Communities dataset (
                  <Badge
                    sx={{ color: baseScoreColor, fontSize: 1, height: 18 }}
                  >
                    {baseRiskScore.toFixed(2)}%
                  </Badge>
                  ). We then use historical wind data from fire weather days to
                  predict how wildfire could spread, which{' '}
                  {baseRiskScore > windRiskScore ? 'decreases' : 'increases'}{' '}
                  the burn probability to{' '}
                  <Badge
                    sx={{ color: windScoreColor, fontSize: 1, height: 18 }}
                  >
                    {windRiskScore!.toFixed(2)}%
                  </Badge>
                  .
                </Box>
                <Box>
                  Read our <Link href='#TK'>research methods</Link> for a
                  detailed description
                </Box>
              </Box>
            )}
          </AnimateHeight>
        </Column>
      </Row>
    </>
  )
}

export default Results
