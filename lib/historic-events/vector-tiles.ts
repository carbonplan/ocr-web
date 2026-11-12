import { PMTiles } from 'pmtiles'
import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import type { Feature, Geometry } from 'geojson'

// Historic event lookups read max-zoom tiles straight from the pmtiles
// archive rather than the map, so the answer never depends on the viewport.

export const tileCoords = (
  lng: number,
  lat: number,
  z: number,
): [number, number] => {
  const n = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  )
  return [x, y]
}

export const readTileFeatures = async (
  archive: PMTiles,
  layerName: string,
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal,
): Promise<Feature<Geometry, Record<string, unknown>>[]> => {
  const tile = await archive.getZxy(z, x, y, signal)
  if (!tile) return []
  const layer = new VectorTile(new PbfReader(tile.data)).layers[layerName]
  if (!layer) return []
  const features: Feature<Geometry, Record<string, unknown>>[] = []
  for (let i = 0; i < layer.length; i++) {
    features.push(
      layer.feature(i).toGeoJSON(x, y, z) as Feature<
        Geometry,
        Record<string, unknown>
      >,
    )
  }
  return features
}

const KM_PER_DEGREE = 111.32

// every max-zoom feature in the tiles covering `km` around the point; a
// feature crossing tile edges comes back once per tile, clipped
export const readFeaturesAround = async (
  archive: PMTiles,
  layerName: string,
  [lng, lat]: [number, number],
  km: number,
  signal?: AbortSignal,
): Promise<Feature<Geometry, Record<string, unknown>>[]> => {
  const z = (await archive.getHeader()).maxZoom
  const dLat = km / KM_PER_DEGREE
  const dLng = dLat / Math.cos((lat * Math.PI) / 180)
  const [x0, y0] = tileCoords(lng - dLng, lat + dLat, z)
  const [x1, y1] = tileCoords(lng + dLng, lat - dLat, z)
  const tiles = []
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      tiles.push(readTileFeatures(archive, layerName, z, x, y, signal))
    }
  }
  return (await Promise.all(tiles)).flat()
}
