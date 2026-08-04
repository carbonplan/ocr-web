import { Box, Flex, Spinner } from 'theme-ui'
import { useStore } from '@/lib/store'
import ValueBadge from './value-badge'

const WindDetail = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)

  const periodLabel = riskConfig.timePeriodLabels
    ? timePeriod === 'current'
      ? riskConfig.timePeriodLabels.current
      : riskConfig.timePeriodLabels.future[futureWindow]
    : null

  return (
    <Box>
      <Box as='h2' variant='sectionHeading'>
        Expected annual loss
      </Box>
      <Box sx={{ mt: 2 }}>
        The risk score is a categorical classification of expected annual loss:
        the average share of a building&apos;s value expected to be lost each
        year to tropical cyclone damage
        {periodLabel ? ` (${periodLabel})` : ''}.
      </Box>
      <Flex sx={{ gap: 3, mt: 3, alignItems: 'baseline' }}>
        <Box
          sx={{
            fontSize: 1,
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            color: 'secondary',
          }}
        >
          Annual loss
        </Box>
        {buildingQuery.status === 'loading' ? (
          <Spinner size={16} />
        ) : (
          <ValueBadge
            value={
              buildingQuery.status === 'success' ? buildingQuery.value : null
            }
            unit='%'
          />
        )}
      </Flex>
      {buildingQuery.status === 'error' && selectedBuilding && (
        <Box sx={{ mt: 2, color: 'secondary', fontSize: [1, 1, 1, 2] }}>
          No wind data is available for this building.
        </Box>
      )}
    </Box>
  )
}

export default WindDetail
