import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Button, Filter, Table } from '@carbonplan/components'
//@ts-expect-error - carbonplan icons types not available
import { RotatingArrow, X } from '@carbonplan/icons'
import { useShallow } from 'zustand/react/shallow'
import { LngLatBounds } from 'maplibre-gl'

import {
  getGeographyRisk,
  getCountyName,
  getBoundingBox,
} from '@/lib/risk-utils'
import { useStore } from '@/lib/store'
import {
  GEOGRAPHY_ATTRIBUTE_KEYS,
  GEOGRAPHY_AUTOSELECT_ZOOM,
} from '@/lib/config'
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
  const countyName = useStore((state) =>
    getCountyName(state.activeGeographies.county),
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
    if (selectedGeographyLevel === 'county') {
      return `${countyName ?? ''} County`
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
    const handleMoveEnd = () => {
      setZoom(map.getZoom())
    }
    map.on('moveend', handleMoveEnd)
    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [map])

  const disabled = zoom < GEOGRAPHY_AUTOSELECT_ZOOM && !selectedBuilding

  return (
    <>
      <Box variant='sectionHeading'>Risk in the region</Box>
      <Filter
        role='group'
        aria-label='Select geographic level'
        variant='filter'
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
          const selected = (Object.keys(obj) as GeographyKey[]).find(
            (k) => obj[k],
          )
          if (selected) {
            setSelectedGeographyLevel(selected)
          }
        }}
        disabled={disabled}
        sx={
          disabled && {
            pointerEvents: 'none',
            '& button': { opacity: 0.1 },
          }
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
          opacity: disabled ? 0.2 : 1,
        }}
      />
      <Flex sx={{ justifyContent: 'space-between', mt: 2 }}>
        <Button
          size='xs'
          inverted={!showOnMap}
          suffix={showOnMap ? <X /> : <RotatingArrow />}
          onClick={handleShowRegionChange}
          disabled={!activeGeography}
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
            {disabled
              ? 'Zoom in to view regional risk distribution'
              : 'No data available'}
          </Box>
        )}
      </Box>
    </>
  )
}

export default RegionalRisk
