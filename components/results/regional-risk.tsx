import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button, Select, Table } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { RotatingArrow, X } from '@carbonplan/icons'
import { useShallow } from 'zustand/react/shallow'
import { LngLatBounds } from 'maplibre-gl'

import { getGeographyRisk, getBoundingBox } from '@/lib/risk-utils'
import { useStore } from '@/lib/store'
import { GEOGRAPHY_ATTRIBUTE_KEYS, GEOGRAPHY_MIN_ZOOM } from '@/lib/config'
import { GeographyKey } from '@/types/location'
import { Download } from './download'
import Histogram, { formatBuildingCount } from './histogram'
import ValueBadge from './value-badge'
import { useScore } from '@/hooks/useScore'

// module level because refs were being reset by react strict mode I think?
let hasUserSelectedGeo = false

const RegionalRisk = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const map = useStore((state) => state.map)
  const geographyLevel = useStore((state) => state.selectedGeographyLevel)
  const setGeographyLevel = useStore((state) => state.setSelectedGeographyLevel)
  const showOnMap = useStore((state) => state.showGeographyHighlight)
  const setShowOnMap = useStore((state) => state.setShowGeographyHighlight)
  const activeGeographies = useStore(
    useShallow((state) => state.activeGeographies),
  )
  const [zoom, setZoom] = useState(0)
  const activeGeography = activeGeographies[geographyLevel]

  useEffect(() => {
    if (!hasUserSelectedGeo) {
      setGeographyLevel(selectedBuilding ? 'county' : 'nation')
    }
  }, [selectedBuilding, setGeographyLevel])

  const { score, color } = useScore(activeGeography ?? null, 'muted')
  const { score: buildingScore } = useScore(selectedBuilding)
  const data = useStore(
    useShallow(
      (state) =>
        getGeographyRisk(
          state.activeGeographies[geographyLevel],
          state.timePeriod,
        ) ?? [],
    ),
  )

  const previousBoundsRef = useRef<LngLatBounds | null>(null)
  const previousBuildingIDRef = useRef<string | null>(null)

  const getRegionName = () => {
    const name = activeGeography?.[GEOGRAPHY_ATTRIBUTE_KEYS.name]
    if (geographyLevel === 'county') {
      return name ? `${name} County` : 'the county'
    }
    if (geographyLevel === 'state') {
      return name ?? 'the state'
    }
    if (geographyLevel === 'nation') {
      return 'the continental US'
    }
    const geoid = activeGeography?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]
    // Extract 4-digit identifiers based on https://www.census.gov/programs-surveys/geography/guidance/geo-identifiers.html
    if (geographyLevel === 'censusTract') {
      return geoid ? `Census Tract ${geoid.slice(5, 9)}` : 'the census tract'
    }
    return geoid ? `Census Block ${geoid.slice(11)}` : 'the census block'
  }

  const getGeographyLabel = (key: GeographyKey): string => {
    const labels: Record<GeographyKey, string> = {
      nation: 'continental US',
      state: 'state',
      county: 'county',
      censusTract: 'census tract',
      censusBlock: 'census block',
    }
    return labels[key]
  }

  const fitBoundsToGeography = useCallback(() => {
    if (map && activeGeography) {
      const bbox = getBoundingBox(activeGeography)
      if (bbox) {
        map.fitBounds(bbox, {
          padding: 100,
          duration: 500,
        })
      }
    }
  }, [map, activeGeography])

  const handleShowRegionChange = () => {
    const newValue = !showOnMap
    setShowOnMap(newValue)
    if (!map) return
    if (newValue) {
      if (!previousBoundsRef.current && selectedBuilding) {
        previousBoundsRef.current = map.getBounds()
      }
      fitBoundsToGeography()
    } else if (previousBoundsRef.current && selectedBuilding) {
      map.fitBounds(previousBoundsRef.current, {
        duration: 500,
      })
      previousBoundsRef.current = null
    }
  }

  useEffect(() => {
    if (showOnMap) {
      fitBoundsToGeography()
    }
    // exclude fitBoundsToGeography from deps to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnMap, geographyLevel])

  useEffect(() => {
    if (!map) return

    if (
      selectedBuilding &&
      selectedBuilding.id !== previousBuildingIDRef.current
    ) {
      const handleMoveEnd = () => {
        previousBoundsRef.current = map.getBounds()
      }
      map.once('moveend', handleMoveEnd)
      previousBuildingIDRef.current = selectedBuilding.id ?? null
    }
  }, [selectedBuilding, map, showOnMap])

  useEffect(() => {
    if (!map) return
    const updateZoom = () => {
      setZoom(map.getZoom())
    }
    updateZoom()
    map.on('moveend', updateZoom)
    return () => {
      map.off('moveend', updateZoom)
    }
  }, [map])

  const isGeographyUnavailable = zoom < GEOGRAPHY_MIN_ZOOM[geographyLevel]

  return (
    <>
      <Box as='h2' variant='sectionHeading'>
        Risk in the region
      </Box>
      <Select
        aria-label='Select geographic level'
        size='xs'
        value={geographyLevel}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          hasUserSelectedGeo = true
          setGeographyLevel(e.target.value as GeographyKey)
        }}
        sx={{
          '& select': {
            fontSize: 1,
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
          },
        }}
      >
        <option value='nation'>CONTINENTAL US</option>
        <option value='state'>STATE</option>
        <option value='county'>COUNTY</option>
        <option value='censusTract'>CENSUS TRACT</option>
        <option value='censusBlock'>CENSUS BLOCK</option>
      </Select>
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
          inverted={!showOnMap}
          suffix={showOnMap ? <X /> : <RotatingArrow />}
          onClick={handleShowRegionChange}
          disabled={!activeGeography}
          aria-label={
            showOnMap
              ? 'Hide selected region on map'
              : 'Show selected region on map'
          }
          sx={{
            '&:disabled': {
              cursor: 'default',
              pointerEvents: 'none',
              color: 'muted',
            },
          }}
        >
          {showOnMap ? 'Hide region' : 'Show region'}
        </Button>
        <Download />
      </Flex>
      <Box sx={{ position: 'relative', mt: 4 }}>
        <Histogram
          region={getRegionName()}
          data={data}
          score={buildingScore}
          sx={data.length > 0 ? undefined : { opacity: 0.1 }}
        />
        {!data.length && (
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
            {isGeographyUnavailable
              ? `Zoom in to view ${getGeographyLabel(geographyLevel)} data`
              : 'No data available'}
          </Box>
        )}
      </Box>
    </>
  )
}

export default RegionalRisk
