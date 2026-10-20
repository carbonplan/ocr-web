import { queryFloodsNearPoint, type FloodAtPoint } from './flood-reports'
import {
  querySatelliteFloodsAtPoint,
  type SatelliteFlood,
} from './flood-satellite'
import { queryNewsFloodsNearPoint, type NewsFlood } from './flood-news'

// Flood records near a point from the three sources, grouped into events by
// date. A record joins the event before it when it starts within GROUP_DAYS
// of a member's start, or before a member's end when that member lasted no
// longer than MAX_WINDOW_DAYS.

export type FloodSource = 'satellite' | 'nws' | 'news'

export type FloodEvent = {
  id: string
  date: string
  year: number
  satellite: SatelliteFlood[]
  reports: FloodAtPoint[]
  news: NewsFlood[]
}

const GROUP_DAYS = 3
// longer records, like seasonal satellite composites, span many floods
const MAX_WINDOW_DAYS = 31
const DAY_MS = 86_400_000

const toTime = (date: string) => new Date(`${date}T00:00:00Z`).getTime()

type Dated = { start: number; joinUntil: number } & (
  | { source: 'satellite'; item: SatelliteFlood }
  | { source: 'nws'; item: FloodAtPoint }
  | { source: 'news'; item: NewsFlood }
)

const dated = (begin: string, end: string) => {
  const start = toTime(begin)
  const stop = toTime(end)
  const window = (stop - start) / DAY_MS
  return {
    start,
    joinUntil: Math.max(
      window <= MAX_WINDOW_DAYS ? stop : start,
      start + GROUP_DAYS * DAY_MS,
    ),
  }
}

export const groupFloodEvents = (
  satellite: SatelliteFlood[],
  reports: FloodAtPoint[],
  news: NewsFlood[],
): FloodEvent[] => {
  const records: Dated[] = [
    ...satellite.map(
      (item): Dated => ({
        ...dated(item.began, item.ended),
        source: 'satellite',
        item,
      }),
    ),
    ...reports.map(
      (item): Dated => ({
        ...dated(item.beginDate, item.endDate),
        source: 'nws',
        item,
      }),
    ),
    ...news.map(
      (item): Dated => ({
        ...dated(item.startDate, item.endDate),
        source: 'news',
        item,
      }),
    ),
  ]
    .filter((r) => Number.isFinite(r.start))
    .sort((a, b) => a.start - b.start)

  const events: FloodEvent[] = []
  let joinUntil = -Infinity
  for (const record of records) {
    if (record.start > joinUntil) {
      const date = new Date(record.start).toISOString().slice(0, 10)
      events.push({
        id: `flood-${date}`,
        date,
        year: Number(date.slice(0, 4)),
        satellite: [],
        reports: [],
        news: [],
      })
      joinUntil = record.joinUntil
    } else {
      joinUntil = Math.max(joinUntil, record.joinUntil)
    }
    const event = events[events.length - 1]
    if (record.source === 'satellite') event.satellite.push(record.item)
    else if (record.source === 'nws') event.reports.push(record.item)
    else event.news.push(record.item)
  }
  return events.reverse()
}

// flood events near the point, most recent first
export const queryFloodHistory = async (
  point: [number, number],
  signal?: AbortSignal,
): Promise<FloodEvent[]> => {
  const [satellite, reports, news] = await Promise.all([
    querySatelliteFloodsAtPoint(point, signal),
    queryFloodsNearPoint(point, signal),
    queryNewsFloodsNearPoint(point, signal),
  ])
  return groupFloodEvents(satellite, reports, news)
}
