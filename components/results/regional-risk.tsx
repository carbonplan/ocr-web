import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link, Select, Table } from '@carbonplan/components'
import { useShallow } from 'zustand/react/shallow'
import { LngLatBounds } from 'maplibre-gl'

import { getGeographyRisk, getBoundingBox } from '@/lib/risk-utils'
import { useStore } from '@/lib/store'
import {
  DATA_VERSION,
  GEOGRAPHY_ATTRIBUTE_KEYS,
  GEOGRAPHY_MIN_ZOOM,
  STATISTICS_PATHS,
} from '@/lib/config'
import { GeographyKey } from '@/types/location'
import { Download, DownloadButton } from './download'
import Histogram, { formatBuildingCount } from './histogram'
import ValueBadge from './value-badge'
import { useScore } from '@/hooks/useScore'
import EyeCheckbox from '../eye-checkbox'
import TooltipWrapper from '../tooltip'

const GEOGRAPHY_LABELS = {
  nation: 'continental US',
  state: 'state',
  county: 'county',
  censusTract: 'census tract',
  censusBlock: 'census block',
}

const GEOGRAPHY_SUMMARY_LABELS = {
  nation: 'National stats',
  state: 'State stats',
  county: 'County stats',
  censusTract: 'Tract stats',
  censusBlock: 'Block stats',
}

const RegionalRisk = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const map = useStore((state) => state.map)
  const geographyLevel = useStore((state) => state.selectedGeographyLevel)
  const setGeographyLevel = useStore((state) => state.setSelectedGeographyLevel)
  const toggleUserSelected = useStore((state) => state.toggleUserSelected)
  const activeGeographies = useStore(
    useShallow((state) => state.activeGeographies),
  )
  const queryGeographiesAtPoint = useStore(
    (state) => state.queryGeographiesAtPoint,
  )
  const [zoom, setZoom] = useState(0)
  const [hasSelectedGeoLevel, setHasSelectedGeoLevel] = useState(false)
  const [showRegion, setShowRegion] = useState(false)
  const activeGeography = activeGeographies[geographyLevel]

  useEffect(() => {
    if (!hasSelectedGeoLevel) {
      setGeographyLevel(selectedBuilding ? 'county' : 'nation')
    }
  }, [hasSelectedGeoLevel, selectedBuilding, setGeographyLevel])

  const { score, color } = useScore(activeGeography ?? null)
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

  function getRegionName(args: { mode: 'short' }): string | null
  function getRegionName(args?: { mode: 'long' }): string
  function getRegionName({ mode } = { mode: 'long' }) {
    const fallback =
      mode === 'short' ? null : `the ${GEOGRAPHY_LABELS[geographyLevel]}`
    if (geographyLevel === 'nation') {
      return fallback
    }

    const name = activeGeography?.[GEOGRAPHY_ATTRIBUTE_KEYS.name]
    if (['county', 'state'].includes(geographyLevel)) {
      if (!name) {
        return fallback
      } else if (geographyLevel === 'county') {
        return `${name} County`
      } else {
        return name
      }
    }

    const geoid = activeGeography?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]
    if (!geoid) {
      return fallback
    }
    // Extract 4-digit identifiers based on https://www.census.gov/programs-surveys/geography/guidance/geo-identifiers.html
    if (geographyLevel === 'censusTract') {
      return mode === 'short'
        ? geoid.slice(5, 9)
        : `Census Tract ${geoid.slice(5, 9)}`
    }
    return mode === 'short'
      ? geoid.slice(11)
      : `Census Block ${geoid.slice(11)}`
  }

  useEffect(() => {
    // Uncheck showRegion checkbox on change of activeGeography
    setShowRegion(false)
  }, [activeGeography])

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

  const handleShowRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked
    if (!map) return
    toggleUserSelected(newValue)
    if (newValue) {
      if (!previousBoundsRef.current) {
        previousBoundsRef.current = map.getBounds()
      }
      fitBoundsToGeography()
    } else if (previousBoundsRef.current) {
      map.fitBounds(previousBoundsRef.current, {
        duration: 500,
      })
      previousBoundsRef.current = null
    }
    setShowRegion(newValue)
  }

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
  }, [selectedBuilding, map])

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
      <Flex sx={{ alignItems: 'baseline', gap: 3 }}>
        <Select
          key='geography'
          aria-label='Select geographic level'
          size='xs'
          value={geographyLevel}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setHasSelectedGeoLevel(true)
            if (!selectedBuilding && map) {
              const center = map.getCenter()
              queryGeographiesAtPoint(center.lng, center.lat, false)
            }
            setGeographyLevel(e.target.value as GeographyKey)
          }}
          sx={{
            '& select': {
              fontSize: 1,
              fontFamily: 'mono',
              letterSpacing: 'mono',
              textTransform: 'uppercase',
            },
            '& svg': {
              fill: 'primary',
            },
          }}
        >
          <option value='nation'>Continental US</option>
          <option value='state'>State</option>
          <option value='county'>County</option>
          <option value='censusTract'>Census tract</option>
          <option value='censusBlock'>Census block</option>
        </Select>
        <Flex
          as='label'
          sx={{
            gap: 1,
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            fontSize: 1,
            cursor: 'pointer',
          }}
        >
          {getRegionName({ mode: 'short' }) ?? <>&#8203;</>}
          <EyeCheckbox checked={showRegion} onChange={handleShowRegionChange} />
        </Flex>
      </Flex>
      <Box sx={{ position: 'relative', mt: 2, mb: 7 }}>
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
              ? `Zoom in to view ${GEOGRAPHY_LABELS[geographyLevel]} data`
              : 'No data available'}
          </Box>
        )}
      </Box>

      <Box>
        <Table
          columns={3}
          start={[1, 2]}
          width={[1, 2]}
          data={[
            [
              'Structures',
              <ValueBadge
                key='count'
                value={
                  activeGeography &&
                  formatBuildingCount(
                    activeGeography[GEOGRAPHY_ATTRIBUTE_KEYS.building_count],
                  )
                }
                unit='#'
                whitespace={false}
                sx={{ minWidth: '34px' }}
              />,
            ],
            [
              'Median score',
              <ValueBadge
                key='median'
                value={score}
                unit='#'
                color={score ? color : undefined}
                whitespace={false}
                sx={{ minWidth: '34px' }}
              />,
            ],
            [
              `Building data`,
              <TooltipWrapper
                key='download'
                tooltip={
                  <>
                    Download risk data for all buildings in {getRegionName()}.
                    For more information about these files, including data
                    schema, see the{' '}
                    <Link
                      sx={{ color: 'secondary' }}
                      href='https://docs.carbonplan.org/ocr/en/latest/access-data.html#schema_2'
                    >
                      documentation
                    </Link>
                    .
                  </>
                }
                sx={{ justifyContent: 'flex-start', gap: 3 }}
              >
                <Download />
              </TooltipWrapper>,
            ],
            [
              GEOGRAPHY_SUMMARY_LABELS[geographyLevel],
              <TooltipWrapper
                key='download'
                tooltip={
                  <>
                    Download summary statistics for
                    {geographyLevel === 'nation'
                      ? ' '
                      : ` each ${GEOGRAPHY_LABELS[geographyLevel]} in `}
                    the continental US. For more information about these files,
                    including data schema, see the{' '}
                    <Link
                      sx={{ color: 'secondary' }}
                      href='https://docs.carbonplan.org/ocr/en/latest/access-data.html#schema_1'
                    >
                      documentation
                    </Link>
                    .
                  </>
                }
                sx={{ justifyContent: 'flex-start', gap: 3 }}
              >
                <Flex
                  sx={{ gap: 3 }}
                  role='group'
                  aria-label='Download regional data'
                >
                  <DownloadButton
                    label='CSV'
                    loading={false}
                    disabled={false}
                    href={`https://s3.us-west-2.amazonaws.com/us-west-2.opendata.source.coop/carbonplan/carbonplan-ocr/output/fire-risk/vector/production/${DATA_VERSION}/region-analysis/${STATISTICS_PATHS[geographyLevel]}/stats.csv`}
                    ariaLabel={`Download summary data as CSV`}
                  />
                  <DownloadButton
                    label='GeoJSON'
                    loading={false}
                    disabled={false}
                    href={`https://s3.us-west-2.amazonaws.com/us-west-2.opendata.source.coop/carbonplan/carbonplan-ocr/output/fire-risk/vector/production/${DATA_VERSION}/region-analysis/${STATISTICS_PATHS[geographyLevel]}/stats.geojson`}
                    ariaLabel={`Download summary data as GeoJSON`}
                  />
                </Flex>
              </TooltipWrapper>,
            ],
          ]}
          index={false}
          sx={{
            '& tr': {
              py: 2,
              alignItems: 'baseline',
            },
            '& tr td:first-of-type': {
              fontFamily: 'mono',
              letterSpacing: 'mono',
              textTransform: 'uppercase',
              color: 'secondary',
              fontSize: 1,
              whiteSpace: 'nowrap',
            },
            '& tr td:last-of-type': {
              fontFamily: 'body',
              letterSpacing: 'body',
            },
          }}
        />
      </Box>
    </>
  )
}

export default RegionalRisk
