import { PMTiles } from 'pmtiles'
import { booleanPointInPolygon, point } from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { readTileFeatures, tileCoords } from './vector-tiles'

// Point-in-polygon against the MTBS perimeter tiles: at max zoom the tile
// under the point holds every perimeter covering it.

export type FireAtPoint = {
  id: string
  name: string
  type: string
  year: number
  date: string
  acres: number
}

type PerimeterFeature = Feature<Polygon | MultiPolygon, Record<string, unknown>>

let archive: PMTiles | null = null

const getArchive = () => {
  if (!archive) archive = new PMTiles(HISTORIC_URLS.firePerimeters)
  return archive
}

const readTile = async (
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal,
): Promise<PerimeterFeature[]> =>
  (
    await readTileFeatures(
      getArchive(),
      LAYERS.firePerimeters.layerName,
      z,
      x,
      y,
      signal,
    )
  ).filter(
    (feature): feature is PerimeterFeature =>
      feature.geometry.type === 'Polygon' ||
      feature.geometry.type === 'MultiPolygon',
  )

const toFire = (feature: PerimeterFeature): FireAtPoint => {
  const props = feature.properties
  return {
    id: String(props.event_id),
    name: String(props.incid_name ?? ''),
    type: String(props.incid_type ?? ''),
    year: Number(props.year),
    date: String(props.ig_date ?? ''),
    acres: Number(props.burnbndac),
  }
}

// perimeters containing the point, most recent first
export const queryFiresAtPoint = async (
  [lng, lat]: [number, number],
  signal?: AbortSignal,
): Promise<FireAtPoint[]> => {
  const header = await getArchive().getHeader()
  const z = header.maxZoom
  const [x, y] = tileCoords(lng, lat, z)
  const pt = point([lng, lat])

  const fires = new Map<string, FireAtPoint>()
  for (const feature of await readTile(z, x, y, signal)) {
    if (booleanPointInPolygon(pt, feature)) {
      const fire = toFire(feature)
      fires.set(fire.id, fire)
    }
  }
  return [...fires.values()].sort((a, b) => b.year - a.year)
}
