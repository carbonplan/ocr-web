import { Box } from 'theme-ui'
import { format } from 'd3-format'
import { useStore } from '@/lib/store'

import DamageCurve from './damage-curve'

const AnnualLoss = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const riskConfig = useStore((state) => state.riskConfig)

  const detail =
    buildingQuery.status === 'success' ? buildingQuery.detail : undefined
  const envelope =
    detail && detail.eadLower !== null && detail.eadUpper !== null
      ? ([
          detail.eadLower * riskConfig.unitScale,
          detail.eadUpper * riskConfig.unitScale,
        ] as [number, number])
      : null

  return (
    <Box>
      <Box sx={{ mt: 2, mb: 3 }}>
        Expected loss from single events of increasing rarity, from a 1-in-10
        year storm to a 1-in-1,000 year storm.
        <br />
        <br />
        Accounting for the middle 50% of damage-model fits to historical
        hurricane losses, annual loss is best understood as a range
        {envelope ? (
          <>
            {' '}
            from {format('.2~f')(envelope[0])} to {format('.2~f')(envelope[1])}
            %.,
          </>
        ) : (
          '.'
        )}
      </Box>
      <DamageCurve
        returnPeriods={detail?.returnPeriods}
        damageFraction={detail?.damageFraction}
        windSpeed={detail?.windSpeed}
        unitScale={riskConfig.unitScale}
        color={riskConfig.accentColor}
      />
      {buildingQuery.status === 'error' &&
        (selectedBuilding || selectedArea) && (
          <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
            No wind data is available for this location.
          </Box>
        )}
    </Box>
  )
}

export default AnnualLoss
