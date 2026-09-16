import { PMTiles } from 'pmtiles'
import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import { booleanPointInPolygon, point } from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'

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
