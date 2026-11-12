import * as zarr from 'zarrita'
import proj4 from 'proj4'
import { openIcechunkStore } from './icechunk'

// Point reader for the FDP store's `point` group: one int16 (layer, y, x)
// array on the native 100 m grid holding fdp, fdp_se and every driver's
// contribution, chunked so all of them at one location are a single small
// read, independent of the render layer's lifecycle.

export type FdpPointData = {
  // probabilities in [0, 1] (multiply by unitScale for display)
  fdp: number | null
  fdpSe: number | null
  // aligned along the driver dimension, in FDP_DRIVERS order
  contribution: (number | null)[]
}

type OpenedStore = {
  // lng/lat to the store's projected x/y
  project: (point: [number, number]) => [number, number]
  // [x pixel size, 0, x origin, 0, y pixel size, y origin], y size negative
  transform: number[]
  shape: [number, number]
  values: zarr.Array<zarr.NumberDataType, zarr.Readable>
  // positions along `layer` of fdp, fdp_se and each contribution
  fdpIndex: number
  fdpSeIndex: number
  contributionIndices: number[]
  scaleFactor: number
  fillValue: number
}

const cache = new Map<string, Promise<OpenedStore>>()

const openStore = (source: string): Promise<OpenedStore> => {
  let entry = cache.get(source)
  if (!entry) {
    entry = (async () => {
      const root = zarr.root(await openIcechunkStore(source))
      const [group, values, layer] = await Promise.all([
        zarr.open(root.resolve('point'), { kind: 'group' }),
        zarr.open(root.resolve('point/values'), { kind: 'array' }),
        zarr.open(root.resolve('point/layer'), { kind: 'array' }),
      ])
      const attrs = group.attrs as Record<string, unknown>
      const valueAttrs = values.attrs as Record<string, unknown>
      const layers = String(
        (layer.attrs as Record<string, unknown>).flag_meanings,
      ).split(' ')
      const converter = proj4('EPSG:4326', attrs['proj:wkt2'] as string)
      return {
        project: (point) => converter.forward(point) as [number, number],
        transform: attrs['spatial:transform'] as number[],
        shape: attrs['spatial:shape'] as [number, number],
        values: values as zarr.Array<zarr.NumberDataType, zarr.Readable>,
        fdpIndex: layers.indexOf('fdp'),
        fdpSeIndex: layers.indexOf('fdp_se'),
        contributionIndices: layers.flatMap((name, i) =>
          name.startsWith('contribution_') ? [i] : [],
        ),
        scaleFactor: (valueAttrs.scale_factor as number) ?? 1,
        fillValue: valueAttrs._FillValue as number,
      }
    })()
    // let a transient failure retry on the next query
    entry.catch(() => cache.delete(source))
    cache.set(source, entry)
  }
  return entry
}

// null when the point falls outside the grid
export const queryFdpPoint = async (
  source: string,
  point: [number, number],
): Promise<FdpPointData | null> => {
  const store = await openStore(source)
  const [x, y] = store.project(point)
  const [dx, , x0, , dy, y0] = store.transform
  const col = Math.floor((x - x0) / dx)
  const row = Math.floor((y - y0) / dy)
  const [rows, cols] = store.shape
  if (row < 0 || row >= rows || col < 0 || col >= cols) return null

  const column = await zarr.get(store.values, [null, row, col])
  const raw = column.data as ArrayLike<number>
  const read = (i: number) =>
    i < 0 || raw[i] === store.fillValue ? null : raw[i] * store.scaleFactor

  return {
    fdp: read(store.fdpIndex),
    fdpSe: read(store.fdpSeIndex),
    contribution: store.contributionIndices.map(read),
  }
}
