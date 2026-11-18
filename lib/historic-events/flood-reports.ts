import { PMTiles } from 'pmtiles'
import { bbox, distance } from '@turf/turf'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { readFeaturesAround, unionBBox, type BBox } from './vector-tiles'

// NWS flood reports whose reported area lies within NEAR_KM of the point.
// Each report is the box between its two reported corners (a line or point
// when the box collapses); a box crossing tile edges is clipped per tile, but
// the part nearest the point is always in one of the tiles covering the
// search radius.

export const NEAR_KM = 3

export type FloodAtPoint = {
  id: number
  // NWS groups the reports from one storm system into an episode
  episodeId: number | null
  type: string
  beginDate: string
  endDate: string
  year: number
  state: string
  county: string
  location: string
  cause: string
  // null when NWS entered no estimate
  damage: number | null
  deaths: number
  injuries: number
  distanceKm: number
  // the reported area, joined across the tiles read around the point
  bbox: BBox
}

let archive: PMTiles | null = null

const getArchive = () => {
  if (!archive) archive = new PMTiles(HISTORIC_URLS.floodReports)
  return archive
}

const toFlood = (
  props: Record<string, unknown>,
  distanceKm: number,
  bbox: BBox,
): FloodAtPoint => ({
  id: Number(props.event_id),
  episodeId: props.episode_id == null ? null : Number(props.episode_id),
  type: String(props.type ?? ''),
  beginDate: String(props.begin_date ?? ''),
  endDate: String(props.end_date ?? ''),
  year: Number(props.year),
  state: String(props.state ?? ''),
  county: String(props.county ?? ''),
  location: String(props.location ?? ''),
  cause: String(props.cause ?? ''),
  damage: props.damage == null ? null : Number(props.damage),
  deaths: Number(props.deaths ?? 0),
  injuries: Number(props.injuries ?? 0),
  distanceKm,
  bbox,
})

// reports near the point, most recent first
export const queryFloodsNearPoint = async (
  [lng, lat]: [number, number],
  signal?: AbortSignal,
): Promise<FloodAtPoint[]> => {
  const features = await readFeaturesAround(
    getArchive(),
    LAYERS.floodReports.layerName,
    [lng, lat],
    NEAR_KM,
    signal,
  )
  const floods = new Map<number, FloodAtPoint>()
  for (const feature of features) {
    // clipped boxes stay axis-aligned, so the nearest point is the clamp; a
    // line's bbox is under 100 m wide, so it stands in for the line
    const box = bbox(feature) as BBox
    const [west, south, east, north] = box
    const nearest = [
      Math.min(Math.max(lng, west), east),
      Math.min(Math.max(lat, south), north),
    ]
    const km = distance([lng, lat], nearest, { units: 'kilometers' })
    if (km > NEAR_KM) continue
    const id = Number(feature.properties.event_id)
    const existing = floods.get(id)
    const merged = unionBBox(existing?.bbox, box)
    if (!existing || km < existing.distanceKm)
      floods.set(id, toFlood(feature.properties, km, merged))
    else existing.bbox = merged
  }
  return [...floods.values()].sort((a, b) =>
    b.beginDate.localeCompare(a.beginDate),
  )
}
