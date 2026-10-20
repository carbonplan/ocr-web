import { Box, Flex } from 'theme-ui'
import {
  Filter,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { format } from 'd3-format'
import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { RISKS, getMapLayer } from '@/lib/hazards'
import { getBinIndex } from '@/hooks/usePeakWind'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'
import { NEAR_KM } from '@/lib/historic-events/flood-reports'
import { SATELLITE_NEAR_KM } from '@/lib/historic-events/flood-satellite'
import { NEWS_NEAR_KM } from '@/lib/historic-events/flood-news'
import type {
  FloodEvent,
  FloodSource,
} from '@/lib/historic-events/flood-history'
import ValueBadge from '../../value-badge'
import { tableSx } from '../../tooltip-table'

const SOURCE_LABELS: Record<FloodSource, string> = {
  satellite: 'Satellite',
  noaa: 'NOAA',
  news: 'News',
}

const formatDollars = (value: number | null) => {
  if (value === null) return '–'
  return value > 0 ? format('$.2~s')(value).replace('G', 'B') : '$0'
}

const formatMonth = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

const formatKm = (km: number) =>
  km < 0.05 ? 'at this location' : `${km.toFixed(1)} km away`

const reportedDamage = (event: FloodEvent) => {
  const known = event.reports.filter((r) => r.damage !== null)
  return known.length ? known.reduce((sum, r) => sum + r.damage!, 0) : null
}

// Flood events near the selected point, most recent first, each colored by
// year.
export const useHistoricFloods = () => {
  const historicEvents = useStore((state) => state.historicEvents)
  const bins =
    getMapLayer(RISKS.flood, HISTORIC_FLOODS_LAYER_ID)?.binBoundaries ?? []
  const colormap = useColormap({ count: bins.length })

  const events =
    historicEvents.status === 'success' && historicEvents.kind === 'floods'
      ? historicEvents.events
      : null
  const colorFor = (event: FloodEvent) =>
    colormap[getBinIndex(bins, event.year) + 1]

  return { status: historicEvents.status, events, colorFor }
}

const satelliteLine = (event: FloodEvent) => {
  const [nearest] = [...event.satellite].sort(
    (a, b) => a.distanceKm - b.distanceKm,
  )
  if (!nearest) return null
  const window =
    nearest.began.slice(0, 7) === nearest.ended.slice(0, 7)
      ? ''
      : ` · ${formatMonth(nearest.began)} to ${formatMonth(nearest.ended)}`
  return `${
    nearest.distanceKm === 0
      ? 'Water mapped at this location'
      : `Water mapped ${Math.round(nearest.distanceKm * 1000)} m away`
  }${nearest.cause ? ` · ${nearest.cause}` : ''}${window}`
}

const noaaLine = (event: FloodEvent) => {
  if (!event.reports.length) return null
  const nearest = Math.min(...event.reports.map((r) => r.distanceKm))
  if (event.reports.length === 1) {
    const [report] = event.reports
    return `${report.type} · ${formatKm(nearest)}${
      report.location ? ` · ${report.location}` : ''
    }`
  }
  return `${event.reports.length} reports · nearest ${formatKm(nearest)}`
}

const newsLine = (event: FloodEvent) => {
  const n = event.news.length
  if (!n) return null
  return `${n} ${n === 1 ? 'article' : 'articles'} placing flooding nearby`
}

const SourceLine = ({
  source,
  children,
}: {
  source: FloodSource
  children: string | null
}) =>
  children ? (
    <Flex sx={{ gap: 2, alignItems: 'baseline', mt: 1 }}>
      <Box
        sx={{
          ...tableSx.tableHead,
          fontSize: [0, 0, 0, 1],
          width: '80px',
          flexShrink: 0,
        }}
      >
        {SOURCE_LABELS[source]}
      </Box>
      <Box sx={{ color: 'secondary', fontSize: [1, 1, 1, 2] }}>{children}</Box>
    </Flex>
  ) : null

const HistoricFloods = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const setHoveredEventId = useStore((state) => state.setHoveredEventId)
  const floodSource = useStore((state) => state.floodSource)
  const setFloodSource = useStore((state) => state.setFloodSource)
  const { status, events, colorFor } = useHistoricFloods()
  const hasSelection = Boolean(selectedBuilding || selectedArea)

  return (
    <Box>
      Floods recorded near this location by three independent sources, grouped
      by date. A flood seen by more than one source is stronger evidence.
      <Box as='ul' sx={{ pl: 3, my: 2 }}>
        <li>
          Satellite: water mapped from MODIS imagery by the Global Flood
          Database within {SATELLITE_NEAR_KM * 1000} m, for large floods from
          2001 to 2018. It misses short flash floods and water under cloud or
          trees.
        </li>
        <li>
          NOAA: National Weather Service flood reports from NOAA&apos;s Storm
          Events Database within {NEAR_KM} km, mapped from 2005. A report marks
          flooding that threatened life or property, so many carry no dollar
          loss.
        </li>
        <li>
          News: places within {NEWS_NEAR_KM * 1000} m that news coverage of
          flooding named, from Google Groundsource since 2000. About one in four
          is wrong.
        </li>
      </Box>
      <Flex sx={{ gap: 3, alignItems: 'baseline', mt: 3 }}>
        <Box sx={tableSx.tableHead}>Map</Box>
        <Filter
          values={{
            satellite: floodSource === 'satellite',
            noaa: floodSource === 'noaa',
            news: floodSource === 'news',
          }}
          labels={SOURCE_LABELS}
          setValues={(values: Record<FloodSource, boolean>) => {
            const selected = (Object.keys(values) as FloodSource[]).find(
              (key) => values[key],
            )
            if (selected) setFloodSource(selected)
          }}
        />
      </Flex>
      {!hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          Select a location to see its flood history.
        </Box>
      )}
      {status === 'error' && hasSelection && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No flood history is available for this location.
        </Box>
      )}
      {events && events.length === 0 && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No flood has been recorded near this location.
        </Box>
      )}
      {events && events.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Flex
            sx={{
              ...tableSx.row,
              justifyContent: 'space-between',
              alignItems: 'baseline',
              py: 1,
            }}
          >
            <Box sx={tableSx.tableHead}>Flood</Box>
            <Box sx={tableSx.tableHead}>NOAA damage</Box>
          </Flex>
          {events.map((event) => (
            <Box
              key={event.id}
              sx={{
                ...tableSx.row,
                py: 2,
                cursor: 'pointer',
                '&:hover': { color: 'primary' },
              }}
              onMouseEnter={() => setHoveredEventId(event.id)}
              onMouseLeave={() => setHoveredEventId(null)}
            >
              <Flex
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 2,
                }}
              >
                <Box>{formatMonth(event.date)}</Box>
                <ValueBadge
                  value={formatDollars(reportedDamage(event))}
                  color={colorFor(event)}
                  unit='#'
                  sx={{ flexShrink: 0 }}
                />
              </Flex>
              <SourceLine source='satellite'>{satelliteLine(event)}</SourceLine>
              <SourceLine source='noaa'>{noaaLine(event)}</SourceLine>
              <SourceLine source='news'>{newsLine(event)}</SourceLine>
            </Box>
          ))}
          <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
            The sources cover different years, so a flood after 2018 has no
            satellite record and one before 2005 rarely has a NOAA report.
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default HistoricFloods
