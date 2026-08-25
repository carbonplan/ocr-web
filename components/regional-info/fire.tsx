import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link, Select, Table } from '@carbonplan/components'
import { useShallow } from 'zustand/react/shallow'
import { LngLatBounds } from 'maplibre-gl'

import { getGeographyRisk, getBoundingBox } from '@/lib/risk-utils'
import { useStore } from '@/lib/store'
import {
  GEOGRAPHY_ATTRIBUTE_KEYS,
  GEOGRAPHY_MIN_ZOOM,
  STATISTICS_PATHS,
} from '@/lib/config'
import { GeographyKey } from '@/types/location'
import { Download, DownloadButton } from './download'
import Histogram, { formatBuildingCount } from './histogram'
import ValueBadge from '../results/value-badge'
import { useScore } from '@/hooks/useScore'
import EyeCheckbox from '../eye-checkbox'
import TooltipWrapper from '../tooltip'

const GEOGRAPHY_LABELS = {
  nation: 'contiguous U.S.',
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

const RegionalFire = () => {
  const regionalData = useStore((state) => state.riskConfig.regionalData)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const map = useStore((state) => state.map)
  const geographyLevel = useStore((state) => state.selectedGeographyLevel)
  const setGeographyLevel = useStore((state) => state.setSelectedGeographyLevel)
  const hasManuallySelectedGeography = useStore(
    (state) => state.hasManuallySelectedGeography,
  )
  const setHasManuallySelectedGeography = useStore(
    (state) => state.setHasManuallySelectedGeography,
  )
  const showOnMap = useStore((state) => state.showGeographyHighlight)
  const setShowOnMap = useStore((state) => state.setShowGeographyHighlight)
  const activeGeographies = useStore(
    useShallow((state) => state.activeGeographies),
  )
  const [zoom, setZoom] = useState(0)
  const activeGeography = activeGeographies[geographyLevel]

  useEffect(() => {
    if (!hasManuallySelectedGeography) {
      setGeographyLevel(selectedBuilding ? 'county' : 'nation')
    }
  }, [hasManuallySelectedGeography, selectedBuilding, setGeographyLevel])

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

  if (!regionalData) return null

  return (
    <>
      <Flex
        sx={{
          alignItems: 'baseline',
          gap: 3,
          flexDirection: ['column', 'row', 'row', 'row'],
        }}
      >
        <Select
          key='geography'
          aria-label='Select geographic level'
          size='xs'
          value={geographyLevel}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setHasManuallySelectedGeography(true)
            setGeographyLevel(e.target.value as GeographyKey)
          }}
          sx={{
            '& select': {
              fontSize: [1, 1, 1, 2],
              fontFamily: 'mono',
              letterSpacing: 'mono',
              textTransform: 'uppercase',
            },
            '& svg': {
              fill: 'primary',
            },
          }}
        >
          <option value='nation'>Continental U.S.</option>
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
            fontSize: [1, 1, 1, 2],
            cursor: 'pointer',
          }}
        >
          {getRegionName({ mode: 'short' }) ?? <>&#8203;</>}
          <EyeCheckbox checked={showOnMap} onChange={handleShowRegionChange} />
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
              ? `Zoom in to view ${GEOGRAPHY_LABELS[geographyLevel]} data.`
              : 'No data available.'}
          </Box>
        )}
      </Box>

      <Box>
        <Table
          columns={[4, 3, 3, 3]}
          start={[1, [3, 2, 2, 2]]}
          width={[1, [3, 2, 2, 2]]}
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
                    Download risk data for all buildings in {getRegionName()}
                    {getRegionName().endsWith('.') ? ' ' : '. '}
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
                    the contiguous U.S. For more information about these files,
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
                  sx={{ gap: 3, flexWrap: 'wrap' }}
                  role='group'
                  aria-label='Download regional data'
                >
                  <DownloadButton
                    label='CSV'
                    loading={false}
                    disabled={false}
                    href={`${regionalData.statsBase}/${STATISTICS_PATHS[geographyLevel]}/stats.csv`}
                    ariaLabel={`Download summary data as CSV`}
                  />
                  <DownloadButton
                    label='GeoJSON'
                    loading={false}
                    disabled={false}
                    href={`${regionalData.statsBase}/${STATISTICS_PATHS[geographyLevel]}/stats.geojson`}
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
              fontSize: [1, 1, 1, 2],
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

export default RegionalFire
