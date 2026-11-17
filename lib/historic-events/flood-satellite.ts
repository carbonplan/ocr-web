import { PMTiles } from 'pmtiles'
import { bbox, point, pointToPolygonDistance } from '@turf/turf'
import type { Feature, Polygon } from 'geojson'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { readFeaturesAround, unionBBox, type BBox } from './vector-tiles'

// Global Flood Database events whose mapped water reached the point. Each
// patch is a connected group of ~250 m MODIS cells, so a building within one
// cell of a patch counts.

export const SATELLITE_NEAR_KM = 0.25

export type SatelliteFlood = {
  id: number
  began: string
  ended: string
  year: number
  cause: string
  country: string
  dead: number
  displaced: number
  eventKm2: number
  distanceKm: number
  // the nearby patches, as far as the tiles read around the point reach
  bbox: BBox
}

let archive: PMTiles | null = null

const getArchive = () => {
  if (!archive) archive = new PMTiles(HISTORIC_URLS.floodSatellite)
  return archive
}

const toSatelliteFlood = (
  props: Record<string, unknown>,
  distanceKm: number,
  bbox: BBox,
): SatelliteFlood => ({
  id: Number(props.dfo_id),
  began: String(props.began ?? ''),
  ended: String(props.ended ?? ''),
  year: Number(props.year),
  cause: String(props.cause ?? ''),
  country: String(props.country ?? ''),
  dead: Number(props.dead ?? 0),
  displaced: Number(props.displaced ?? 0),
  eventKm2: Number(props.event_km2 ?? 0),
  distanceKm,
  bbox,
})

export const querySatelliteFloodsAtPoint = async (
  [lng, lat]: [number, number],
  signal?: AbortSignal,
): Promise<SatelliteFlood[]> => {
  const features = await readFeaturesAround(
    getArchive(),
    LAYERS.floodSatellite.layerName,
    [lng, lat],
    SATELLITE_NEAR_KM,
    signal,
  )
  const pt = point([lng, lat])
  const pad = SATELLITE_NEAR_KM / 111.32 / Math.cos((lat * Math.PI) / 180)
  const floods = new Map<number, SatelliteFlood>()
  for (const feature of features) {
    if (feature.geometry.type !== 'Polygon') continue
    const box = bbox(feature) as BBox
    const [west, south, east, north] = box
    if (lng < west - pad || lng > east + pad) continue
    if (lat < south - pad || lat > north + pad) continue
    // negative inside the patch
    const km = Math.max(
      0,
      pointToPolygonDistance(pt, feature as Feature<Polygon>, {
        units: 'kilometers',
      }),
    )
    if (km > SATELLITE_NEAR_KM) continue
    const id = Number(feature.properties.dfo_id)
    const existing = floods.get(id)
    const merged = unionBBox(existing?.bbox, box)
    if (!existing || km < existing.distanceKm)
      floods.set(id, toSatelliteFlood(feature.properties, km, merged))
    else existing.bbox = merged
  }
  return [...floods.values()]
}
