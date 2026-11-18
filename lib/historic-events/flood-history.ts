import { queryFloodsNearPoint, type FloodAtPoint } from './flood-reports'
import {
  querySatelliteFloodsAtPoint,
  type SatelliteFlood,
} from './flood-satellite'
import { queryNewsFloodsNearPoint, type NewsFlood } from './flood-news'

// Flood records near a point from the three sources, grouped into events.
// NOAA reports group by the NWS episode, one storm system. Satellite and news
// records join the episode whose dates they fall in (within GROUP_DAYS of its
// start, through the end of its reports), and the rest group among themselves
// by date: a record joins the event before it when it starts within
// GROUP_DAYS of a member's start, or before a member's end when that member
// lasted no longer than MAX_WINDOW_DAYS.

export type FloodSource = 'satellite' | 'noaa' | 'news'

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
  | { source: 'noaa'; item: FloodAtPoint }
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

const newEvent = (id: string, start: number): FloodEvent => {
  const date = new Date(start).toISOString().slice(0, 10)
  return {
    id,
    date,
    year: Number(date.slice(0, 4)),
    satellite: [],
    reports: [],
    news: [],
  }
}

const add = (event: FloodEvent, record: Dated) => {
  if (record.start < toTime(event.date)) {
    event.date = new Date(record.start).toISOString().slice(0, 10)
    event.year = Number(event.date.slice(0, 4))
  }
  if (record.source === 'satellite') event.satellite.push(record.item)
  else if (record.source === 'noaa') event.reports.push(record.item)
  else event.news.push(record.item)
}

export const groupFloodEvents = (
  satellite: SatelliteFlood[],
  reports: FloodAtPoint[],
  news: NewsFlood[],
): FloodEvent[] => {
  const episodes = new Map<string, { event: FloodEvent; joinUntil: number }>()
  const byEpisode = new Map<string, Dated[]>()
  for (const item of reports) {
    const record: Dated = {
      ...dated(item.beginDate, item.endDate),
      source: 'noaa',
      item,
    }
    if (!Number.isFinite(record.start)) continue
    const key = String(item.episodeId ?? `report-${item.id}`)
    byEpisode.set(key, [...(byEpisode.get(key) ?? []), record])
  }
  for (const [key, records] of byEpisode) {
    const start = Math.min(...records.map((r) => r.start))
    const event = newEvent(`noaa-${key}`, start)
    records.forEach((r) => add(event, r))
    episodes.set(key, {
      event,
      joinUntil: Math.max(...records.map((r) => r.joinUntil)),
    })
  }

  const others: Dated[] = []
  for (const record of [
    ...satellite.map(
      (item): Dated => ({
        ...dated(item.began, item.ended),
        source: 'satellite',
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
  ]) {
    if (!Number.isFinite(record.start)) continue
    let match: FloodEvent | null = null
    let gap = Infinity
    for (const { event, joinUntil } of episodes.values()) {
      const episodeStart = toTime(event.date)
      if (record.start < episodeStart - GROUP_DAYS * DAY_MS) continue
      if (record.start > joinUntil) continue
      const d = Math.abs(record.start - episodeStart)
      if (d < gap) {
        match = event
        gap = d
      }
    }
    if (match) add(match, record)
    else others.push(record)
  }

  const events = [...episodes.values()].map(({ event }) => event)
  let joinUntil = -Infinity
  for (const record of others.sort((a, b) => a.start - b.start)) {
    if (record.start > joinUntil) {
      const event = newEvent('', record.start)
      event.id = `flood-${event.date}-${record.source}`
      events.push(event)
      joinUntil = record.joinUntil
    } else {
      joinUntil = Math.max(joinUntil, record.joinUntil)
    }
    add(events[events.length - 1], record)
  }
  return events.sort((a, b) => b.date.localeCompare(a.date))
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
