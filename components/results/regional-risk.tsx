import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button, Filter, Table } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { RotatingArrow } from '@carbonplan/icons'
import { useShallow } from 'zustand/react/shallow'

import {
  getGeographyRisk,
  getCountyName,
  getBoundingBox,
} from '@/lib/risk-utils'
import { useStore } from '@/lib/store'
import { GEOGRAPHY_ATTRIBUTE_KEYS } from '@/lib/config'
import { GeographyKey } from '@/types/location'
import { Download } from './download'
import Histogram, { formatBuildingCount } from './histogram'
import ValueBadge from './value-badge'
import { useScore } from '@/hooks/useScore'

const RegionalRisk = () => {
  const selectedLocation = useStore((state) => state.selectedLocation)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const map = useStore((state) => state.map)
  const selectedGeographyLevel = useStore(
    (state) => state.selectedGeographyLevel,
  )
  const setSelectedGeographyLevel = useStore(
    (state) => state.setSelectedGeographyLevel,
  )
  const activeGeographies = useStore(
    useShallow((state) => state.activeGeographies),
  )
  const countyName = useStore((state) =>
    getCountyName(state.activeGeographies.county),
  )
  const activeGeography = activeGeographies[selectedGeographyLevel]
  const { score, color } = useScore(activeGeography ?? null, 'muted')
  const { score: buildingScore } = useScore(selectedBuilding)
  const data = useStore(
    useShallow(
      (state) =>
        getGeographyRisk(
          state.activeGeographies[selectedGeographyLevel],
          state.timePeriod,
        ) ?? [],
    ),
  )

  const getRegionName = () => {
    if (selectedGeographyLevel === 'county') {
      return `${countyName ?? ''} County`
    }
    if (selectedGeographyLevel === 'censusTract') {
      return 'the census tract'
    }
    return 'the census block'
  }

  const handleShowOnMap = () => {
    if (map && activeGeography) {
      const bbox = getBoundingBox(activeGeography)
      if (bbox) {
        map.fitBounds(bbox, {
          padding: 100,
          duration: 500,
        })
      }
    }
  }

  return (
    <>
      <Box variant='sectionHeading'>Risk in the region</Box>
      <Filter
        values={{
          county: selectedGeographyLevel === 'county',
          censusTract: selectedGeographyLevel === 'censusTract',
          censusBlock: selectedGeographyLevel === 'censusBlock',
        }}
        labels={{
          county: 'County',
          censusTract: 'Census tract',
          censusBlock: 'Census block',
        }}
        setValues={(obj: Record<GeographyKey, boolean>) => {
          if (!selectedLocation) return
          const selected = (Object.keys(obj) as GeographyKey[]).find(
            (k: GeographyKey) => obj[k],
          ) as GeographyKey
          if (selected) {
            setSelectedGeographyLevel(selected)
          }
        }}
        disabled={!selectedLocation}
        sx={{
          button: {
            borderColor: !selectedLocation ? 'secondary' : 'primary',
            color: !selectedLocation ? 'secondary' : 'primary',
          },
        }}
      />
      <Button
        size='xs'
        inverted
        suffix={<RotatingArrow />}
        onClick={handleShowOnMap}
        disabled={!selectedLocation}
        sx={{ mt: 2 }}
      >
        Show on map
      </Button>
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
      <Flex sx={{ justifyContent: 'flex-end', mt: 2 }}>
        <Download
          geography={selectedGeographyLevel}
          disabled={!selectedLocation}
        />
      </Flex>
      <Box sx={{ position: 'relative', mt: 2 }}>
        <Histogram
          region={getRegionName()}
          data={data}
          score={buildingScore}
          sx={
            selectedLocation && data.length > 0 ? undefined : { opacity: 0.1 }
          }
        />
        {(!selectedLocation || data.length === 0) && (
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
            {selectedLocation && data.length === 0
              ? 'No data available'
              : 'Select a structure to view regional risk distribution'}
          </Box>
        )}
      </Box>
    </>
  )
}

export default RegionalRisk
