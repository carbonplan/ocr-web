import { useEffect, useState } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button, Filter, Table } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { RotatingArrow } from '@carbonplan/icons'
import { useShallow } from 'zustand/react/shallow'

import { getGeographyRisk, getCountyName } from '@/lib/risk-utils'
import { useStore } from '@/lib/store'
import { GEOGRAPHY_ATTRIBUTE_KEYS } from '@/lib/config'
import { GeographyKey } from '@/types/location'
import { Download } from './download'
import Histogram, { formatBuildingCount } from './histogram'
import ValueBadge from './value-badge'
import { useScore } from '@/hooks/useScore'

const RegionalRisk = () => {
  const [geography, setGeography] = useState<GeographyKey>()
  const selectedLocation = useStore((state) => state.selectedLocation)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const countyName = useStore((state) =>
    getCountyName(state.activeGeographies.county),
  )
  const activeGeography = useStore(
    useShallow((state) => geography && state.activeGeographies[geography]),
  )
  const { score, color } = useScore(activeGeography ?? null, 'muted')
  const { score: buildingScore } = useScore(selectedBuilding)
  const data = useStore(
    useShallow((state) =>
      geography
        ? (getGeographyRisk(
            state.activeGeographies[geography],
            state.timePeriod,
          ) ?? [])
        : [],
    ),
  )

  useEffect(() => {
    if (!!selectedLocation && !geography) {
      setGeography('county')
    } else if (!selectedLocation && geography) {
      setGeography(undefined)
    }
  }, [geography, selectedLocation])

  const getRegionName = () => {
    if (geography === 'county') {
      return `${countyName ?? ''} County`
    }
    if (geography === 'censusTract') {
      return 'the census tract'
    }
    return 'the census block'
  }
  console.log(data)

  return (
    <>
      <Box variant='sectionHeading'>Risk in the region</Box>
      <Filter
        values={{
          county: geography === 'county',
          censusTract: geography === 'censusTract',
          censusBlock: geography === 'censusBlock',
        }}
        labels={{
          county: 'County',
          censusTract: 'Census tract',
          censusBlock: 'Census block',
        }}
        setValues={(obj: Record<GeographyKey, boolean>) =>
          selectedLocation
            ? setGeography(
                (Object.keys(obj) as GeographyKey[]).find(
                  (k: GeographyKey) => obj[k],
                ),
              )
            : null
        }
      />
      <Table
        columns={3}
        start={[1, 2]}
        width={[1, 2]}
        data={[
          ['Structures', 'Median risk score'],
          [
            <ValueBadge
              key='count'
              value={
                activeGeography &&
                formatBuildingCount(
                  activeGeography[GEOGRAPHY_ATTRIBUTE_KEYS.building_count],
                )
              }
              unit='#'
              sx={{ minWidth: '34px' }}
            />,
            <ValueBadge
              key='median'
              value={score}
              unit='#'
              color={color}
              sx={{ minWidth: '34px' }}
            />,
          ],
        ]}
        index={false}
        borderTop={false}
        sx={{
          mt: 3,
          '& tr': {
            py: 2,
          },
          '& tr:first-of-type': {
            py: 1,
          },
          '& tr:first-of-type td': {
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            color: 'secondary',
            fontSize: 1,
          },
        }}
      />
      <Flex sx={{ justifyContent: 'space-between', mt: 2 }}>
        <Button
          size='xs'
          inverted
          suffix={<RotatingArrow />}
          disabled
          sx={
            geography && false // TODO: remove when behavior is implemented
              ? {}
              : { pointerEvents: 'none', color: 'muted' }
          }
        >
          Show on map
        </Button>
        <Download geography={geography ?? 'county'} disabled={!geography} />
      </Flex>
      <Box sx={{ position: 'relative', mt: 4 }}>
        <Histogram
          region={getRegionName()}
          data={data}
          score={buildingScore}
          sx={geography && data.length > 0 ? undefined : { opacity: 0.1 }}
        />
        {(!geography || data.length === 0) && (
          <Box
            sx={{
              position: 'absolute',
              top: '35%',
              width: '100%',
              textAlign: 'center',
              px: 7,
              color: 'secondary',
            }}
          >
            {geography && data.length === 0
              ? 'No data available'
              : 'Select a structure to view regional risk distribution'}
          </Box>
        )}
      </Box>
    </>
  )
}

export default RegionalRisk
