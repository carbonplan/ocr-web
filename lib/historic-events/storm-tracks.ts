import {
  batchToGeoJSON,
  coalescing,
  httpSource,
  openReader,
  readFeatures,
} from 'tiled-geoparquet'
import { pointToLineDistance } from '@turf/turf'
import type { Feature, FeatureCollection, LineString } from 'geojson'
import { HISTORIC_URLS } from '@/lib/config'

// IBTrACS best-track segments (ocr-multi-hazard: ocr.historic.ibtracs), one
// row per 3-hourly segment of every storm since 2004 whose tropical-storm-force
// winds reached CONUS. The ~270 KB file is read whole once: it feeds both the
// map's tracks and the point lookup.

export type SegmentProperties = {
  sid: string
  name: string
  season: number
  basin: string
  iso_time: string
  // recorded 1-min sustained wind, kt
  usa_wind: number | null
  // farthest extent of 34 kt winds; null below tropical-storm strength
  r34_nmi: number | null
}

export type Segment = Feature<LineString, SegmentProperties>

export type StormAtPoint = {
  sid: string
  name: string
  season: number
  // first segment whose 34 kt winds reached the point
  time: string
  // strongest recorded wind while its 34 kt winds reached the point, kt
  wind: number
}

const COLUMNS = [
  'sid',
  'name',
  'season',
  'basin',
  'iso_time',
  'usa_wind',
  'r34_nmi',
]

let cache: Promise<FeatureCollection<LineString, SegmentProperties>> | null =
  null

export const loadStormTracks = () => {
  if (!cache) {
    cache = (async () => {
      const reader = await openReader(
        coalescing(await httpSource([HISTORIC_URLS.stormTracks])),
      )
      const batch = await readFeatures(reader, {
        bbox: [-180, -90, 180, 90],
        resolution: 1,
        columns: COLUMNS,
        geometry: 'primary',
      })
      const collection = batchToGeoJSON(batch) as FeatureCollection
      return {
        type: 'FeatureCollection',
        features: collection.features.map((feature) => {
          const props = feature.properties as Record<string, unknown>
          const number = (value: unknown) =>
            value === null || value === undefined ? null : Number(value)
          return {
            type: 'Feature',
            geometry: feature.geometry as LineString,
            properties: {
              sid: String(props.sid),
              name: String(props.name ?? ''),
              season: Number(props.season),
              basin: String(props.basin ?? ''),
              iso_time: String(props.iso_time ?? ''),
              usa_wind: number(props.usa_wind),
              r34_nmi: number(props.r34_nmi),
            },
          }
        }),
      }
    })()
    cache.catch(() => {
      cache = null
    })
  }
  return cache
}

const KM_PER_NMI = 1.852
const KM_PER_DEGREE = 111.32

// Storms whose 34 kt winds reached the point by the best track (the point lies
// within a segment's R34 of it), strongest first.
export const queryStormsAtPoint = async ([lng, lat]: [number, number]): Promise<
  StormAtPoint[]
> => {
  const { features } = await loadStormTracks()
  const cosLat = Math.cos((lat * Math.PI) / 180)
  const storms = new Map<string, StormAtPoint>()
  for (const segment of features) {
    const { r34_nmi: r34, usa_wind: wind } = segment.properties
    if (!r34) continue
    const reachKm = r34 * KM_PER_NMI
    const dLat = reachKm / KM_PER_DEGREE
    const dLng = dLat / cosLat
    const coords = segment.geometry.coordinates
    const lngs = coords.map((c) => c[0])
    const lats = coords.map((c) => c[1])
    if (
      lng < Math.min(...lngs) - dLng ||
      lng > Math.max(...lngs) + dLng ||
      lat < Math.min(...lats) - dLat ||
      lat > Math.max(...lats) + dLat
    ) {
      continue
    }
    if (
      pointToLineDistance([lng, lat], segment, { units: 'kilometers' }) >
      reachKm
    )
      continue
    const { sid, name, season, iso_time } = segment.properties
    const storm = storms.get(sid)
    if (!storm) {
      storms.set(sid, { sid, name, season, time: iso_time, wind: wind ?? 0 })
    } else {
      storm.wind = Math.max(storm.wind, wind ?? 0)
      if (iso_time < storm.time) storm.time = iso_time
    }
  }
  return [...storms.values()].sort((a, b) => b.wind - a.wind)
}
