import { PMTiles } from 'pmtiles'
import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import {
  booleanPointInPolygon,
  lineString,
  point,
  pointToLineDistance,
  polygonToLine,
} from '@turf/turf'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { NEARBY_FIRE_KM } from './index'

// Point-in-polygon against the MTBS perimeter tiles, read straight from the
// pmtiles archive rather than the map: at max zoom the tile under the point
// holds every perimeter covering it, whatever the viewport shows.

export type FireAtPoint = {
  id: string
  name: string
  type: string
  year: number
  date: string
  acres: number
  // 0 when the perimeter contains the point
  distanceKm: number
}

export type FireQueryResult = {
  // perimeters containing the point, most recent first
  fires: FireAtPoint[]
  // closest perimeter within NEARBY_FIRE_KM when none contains the point
  nearest: FireAtPoint | null
}

type PerimeterFeature = Feature<Polygon | MultiPolygon, Record<string, unknown>>

let archive: PMTiles | null = null

const getArchive = () => {
  if (!archive) archive = new PMTiles(HISTORIC_URLS.firePerimeters)
  return archive
}

const tileCoords = (lng: number, lat: number, z: number): [number, number] => {
  const n = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  )
  return [x, y]
}

const readTile = async (
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal,
): Promise<PerimeterFeature[]> => {
  const tile = await getArchive().getZxy(z, x, y, signal)
  if (!tile) return []
  const layer = new VectorTile(new PbfReader(tile.data)).layers[
    LAYERS.firePerimeters.layerName
  ]
  if (!layer) return []
  const features: PerimeterFeature[] = []
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i).toGeoJSON(x, y, z)
    if (
      feature.geometry.type === 'Polygon' ||
      feature.geometry.type === 'MultiPolygon'
    ) {
      features.push(feature as PerimeterFeature)
    }
  }
  return features
}

const toFire = (feature: PerimeterFeature, distanceKm: number): FireAtPoint => {
  const props = feature.properties
  return {
    id: String(props.event_id),
    name: String(props.incid_name ?? ''),
    type: String(props.incid_type ?? ''),
    year: Number(props.year),
    date: String(props.ig_date ?? ''),
    acres: Number(props.burnbndac),
    distanceKm,
  }
}

const boundaryDistanceKm = (
  feature: PerimeterFeature,
  pt: ReturnType<typeof point>,
): number => {
  const lines = polygonToLine(feature)
  const parts = 'features' in lines ? lines.features : [lines]
  const rings: Position[][] = parts.flatMap((part) =>
    part.geometry.type === 'MultiLineString'
      ? part.geometry.coordinates
      : [part.geometry.coordinates],
  )
  return Math.min(
    ...rings.map((ring) =>
      pointToLineDistance(pt, lineString(ring), { units: 'kilometers' }),
    ),
  )
}

export const queryFiresAtPoint = async (
  [lng, lat]: [number, number],
  signal?: AbortSignal,
): Promise<FireQueryResult> => {
  const header = await getArchive().getHeader()
  const z = header.maxZoom
  const [x, y] = tileCoords(lng, lat, z)
  const pt = point([lng, lat])

  const fires = new Map<string, FireAtPoint>()
  for (const feature of await readTile(z, x, y, signal)) {
    if (booleanPointInPolygon(pt, feature)) {
      const fire = toFire(feature, 0)
      fires.set(fire.id, fire)
    }
  }
  const contained = [...fires.values()].sort((a, b) => b.year - a.year)
  if (contained.length > 0) return { fires: contained, nearest: null }

  const neighbors: Promise<PerimeterFeature[]>[] = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      neighbors.push(readTile(z, x + dx, y + dy, signal))
    }
  }
  let nearest: FireAtPoint | null = null
  for (const feature of (await Promise.all(neighbors)).flat()) {
    const distanceKm = boundaryDistanceKm(feature, pt)
    if (
      distanceKm <= NEARBY_FIRE_KM &&
      (!nearest || distanceKm < nearest.distanceKm)
    ) {
      nearest = toFire(feature, distanceKm)
    }
  }
  return { fires: [], nearest }
}
