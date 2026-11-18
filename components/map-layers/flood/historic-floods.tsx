import { Box, Flex } from 'theme-ui'
import {
  Filter,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { format } from 'd3-format'
import { useStore } from '@/lib/store'
import { useEventSelection, eventRowSx } from '@/hooks/useEventSelection'
import { unionBBox, type BBox } from '@/lib/historic-events/vector-tiles'
import { NEAR_KM } from '@/lib/historic-events/flood-reports'
import { SATELLITE_NEAR_KM } from '@/lib/historic-events/flood-satellite'
import { NEWS_NEAR_KM } from '@/lib/historic-events/flood-news'
import type {
  FloodEvent,
  FloodSource,
} from '@/lib/historic-events/flood-history'
import ValueBadge from '../../value-badge'
import { ShowMoreRow, useShowMore } from '../show-more'
import TooltipWrapper from '../../tooltip'
import { tableSx } from '../../tooltip-table'

const SOURCE_LABELS: Record<FloodSource, string> = {
  noaa: 'NOAA',
  satellite: 'Satellite',
  news: 'News',
}

const SOURCE_DESCRIPTIONS: Record<FloodSource, string> = {
  satellite: `Water mapped within ${SATELLITE_NEAR_KM * 1000} m by the Global Flood Database, 2001 to 2018. Misses flash floods and water under cloud or trees.`,
  noaa: `Storm Events flood reports within ${NEAR_KM} km, since 2005. Many carry no dollar loss.`,
  news: `Places within ${NEWS_NEAR_KM * 1000} m named in flood news coverage (Google Groundsource), since 2000. About one in four is wrong.`,
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

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`)
    .toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    .replace(',', '')

const formatKm = (km: number) =>
  km < 0.05 ? 'at this location' : `${km.toFixed(1)} km away`

const RECORDS: Record<FloodSource, (event: FloodEvent) => { bbox: BBox }[]> = {
  satellite: (event) => event.satellite,
  noaa: (event) => event.reports,
  news: (event) => event.news,
}

const reportedDamage = (event: FloodEvent) => {
  const known = event.reports.filter((r) => r.damage !== null)
  return known.length ? known.reduce((sum, r) => sum + r.damage!, 0) : null
}

// Flood events near the selected point, most recent first, each colored by
// year.
export const useHistoricFloods = () => {
  const historicEvents = useStore((state) => state.historicEvents)

  const events =
    historicEvents.status === 'success' && historicEvents.kind === 'floods'
      ? historicEvents.events
      : null
  return { status: historicEvents.status, events }
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

const LINES: Record<FloodSource, (event: FloodEvent) => string | null> = {
  satellite: satelliteLine,
  noaa: noaaLine,
  news: newsLine,
}

// the event's records from the mapped source
const eventBBox = (event: FloodEvent, source: FloodSource) =>
  RECORDS[source](event).reduce<BBox | null>(
    (box, record) => unionBBox(box ?? undefined, record.bbox),
    null,
  )

const HistoricFloods = () => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const floodSource = useStore((state) => state.floodSource)
  const setFloodSource = useStore((state) => state.setFloodSource)
  const { status, events } = useHistoricFloods()
  const hasSelection = Boolean(selectedBuilding || selectedArea)
  const mapped = events?.filter((event) => RECORDS[floodSource](event).length)
  const { rowProps, isActive } = useEventSelection()
  const { visible, showMoreProps } = useShowMore(
    mapped,
    (event) => event.id,
    floodSource,
  )

  return (
    <Box>
      Floods recorded near this location from three sources:
      <TooltipWrapper
        tooltip={SOURCE_DESCRIPTIONS[floodSource]}
        sx={{ justifyContent: 'flex-start', mt: 2 }}
      >
        <Filter
          values={{
            noaa: floodSource === 'noaa',
            satellite: floodSource === 'satellite',
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
      </TooltipWrapper>
      <Box sx={{ mt: 3 }}>
        <Flex
          sx={{
            ...tableSx.row,
            justifyContent: 'space-between',
            alignItems: 'baseline',
            py: 1,
          }}
        >
          <Box sx={tableSx.tableHead}>Date</Box>
          <Box sx={tableSx.tableHead}>damage</Box>
        </Flex>
        {!hasSelection && (
          <Box sx={{ mt: 2, color: 'secondary' }}>
            Select a location to see its flood history.
          </Box>
        )}
        {status === 'error' && hasSelection && (
          <Box sx={{ mt: 2, color: 'secondary' }}>
            No flood history is available for this location.
          </Box>
        )}
        {events && events.length === 0 && (
          <Box sx={{ mt: 2, color: 'secondary' }}>
            No flood has been recorded near this location.
          </Box>
        )}
        {events && events.length > 0 && mapped?.length === 0 && (
          <Box sx={{ mt: 2, color: 'secondary' }}>
            No {floodSource === 'noaa' ? 'NOAA' : floodSource} record of a flood
            near this location. Map another source to see the{' '}
            {events.length === 1 ? 'one' : events.length}{' '}
            {events.length > 1 ? 'floods' : 'flood'} recorded here.
          </Box>
        )}

        {visible.map((event) => {
          const damage = reportedDamage(event)
          return (
            <Box
              key={event.id}
              sx={{
                ...tableSx.row,
                py: 2,
                ...eventRowSx(isActive(event.id)),
              }}
              {...rowProps(event.id, eventBBox(event, floodSource))}
            >
              <Flex
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 2,
                }}
              >
                <Box sx={tableSx.tableHead}>{formatDate(event.date)}</Box>
                <ValueBadge
                  value={damage ? formatDollars(damage) : null}
                  unit='$'
                  sx={{
                    flexShrink: 0,
                    ...(damage === null && { color: 'secondary' }),
                  }}
                />
              </Flex>
              <Box sx={{ mt: 1, fontFamily: 'faux', letterSpacing: 'faux' }}>
                {LINES[floodSource](event)}
              </Box>
            </Box>
          )
        })}
        <ShowMoreRow {...showMoreProps} />
      </Box>
    </Box>
  )
}

export default HistoricFloods
