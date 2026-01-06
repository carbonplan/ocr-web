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

const RegionalRisk = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const map = useStore((state) => state.map)
  const selectedGeographyLevel = useStore(
    (state) => state.selectedGeographyLevel,
  )
  const setSelectedGeographyLevel = useStore(
    (state) => state.setSelectedGeographyLevel,
  )
  const showOnMap = useStore((state) => state.showGeographyHighlight)
  const setShowOnMap = useStore((state) => state.setShowGeographyHighlight)
  const activeGeographies = useStore(
    useShallow((state) => state.activeGeographies),
  )
  const activeGeography = activeGeographies[selectedGeographyLevel]
  const [zoom, setZoom] = useState(0)

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

  const previousBoundsRef = useRef<LngLatBounds | null>(null)
  const previousBuildingIDRef = useRef<string | null>(null)

  const getRegionName = () => {
    const name = activeGeography?.[GEOGRAPHY_ATTRIBUTE_KEYS.name]
    if (selectedGeographyLevel === 'county') {
      return name ? `${name} County` : 'the county'
    }
    if (selectedGeographyLevel === 'state') {
      return name ?? 'the state'
    }
    if (selectedGeographyLevel === 'nation') {
      return 'CONUS'
    }
    const geoid = activeGeography?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]
    // Extract 4-digit identifiers based on https://www.census.gov/programs-surveys/geography/guidance/geo-identifiers.html
    if (selectedGeographyLevel === 'censusTract') {
      return geoid ? `Census Tract ${geoid.slice(5, 9)}` : 'the census tract'
    }
    return geoid ? `Census Block ${geoid.slice(11)}` : 'the census block'
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
  }, [showOnMap, selectedGeographyLevel])

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
    map.on('zoom', updateZoom)
    return () => {
      map.off('zoom', updateZoom)
    }
  }, [map])

  const isGeographyDisabled = (key: GeographyKey) => {
    if (selectedBuilding) return false
    return zoom < GEOGRAPHY_MIN_ZOOM[key]
  }

  const disabledGeographies = {
    county: isGeographyDisabled('county'),
    censusTract: isGeographyDisabled('censusTract'),
    censusBlock: isGeographyDisabled('censusBlock'),
    state: isGeographyDisabled('state'),
    nation: isGeographyDisabled('nation'),
  }

  return (
    <>
      <Box as='h2' variant='sectionHeading'>
        Risk in the region
      </Box>
      <Select
        aria-label='Select geographic level'
        size='xs'
        value={selectedGeographyLevel}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          setSelectedGeographyLevel(e.target.value as GeographyKey)
        }}
        sx={{ width: '100%' }}
        sxSelect={{ width: '100%' }}
      >
        <option value='nation' disabled={disabledGeographies.nation}>
          CONUS{disabledGeographies.nation ? ' (zoom in)' : ''}
        </option>
        <option value='state' disabled={disabledGeographies.state}>
          State{disabledGeographies.state ? ' (zoom in)' : ''}
        </option>
        <option value='county' disabled={disabledGeographies.county}>
          County{disabledGeographies.county ? ' (zoom in)' : ''}
        </option>
        <option value='censusTract' disabled={disabledGeographies.censusTract}>
          Census tract{disabledGeographies.censusTract ? ' (zoom in)' : ''}
        </option>
        <option value='censusBlock' disabled={disabledGeographies.censusBlock}>
          Census block{disabledGeographies.censusBlock ? ' (zoom in)' : ''}
        </option>
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
          opacity: disabledGeographies[selectedGeographyLevel] ? 0.2 : 1,
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
            {disabledGeographies[selectedGeographyLevel]
              ? 'Zoom in or select a larger region'
              : 'No data available'}
          </Box>
        )}
      </Box>
    </>
  )
}

export default RegionalRisk
