import * as zarr from 'zarrita'
import proj4 from 'proj4'
import { openIcechunkStore } from './icechunk'
import type { HazardDataset } from './hazards'

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

type Block = {
  row0: number
  col0: number
  height: number
  width: number
  data: ArrayLike<number>
}

// Decoded (layer, y, x) chunks by store and chunk origin, most recently used
// last: a point read fetches its whole chunk anyway, so nearby points need none.
const blocks = new Map<string, Promise<Block>>()
const BLOCK_LIMIT = 16

const readBlock = (
  source: string,
  store: OpenedStore,
  row: number,
  col: number,
): Promise<Block> => {
  const [, height, width] = store.values.chunks
  const row0 = row - (row % height)
  const col0 = col - (col % width)
  const key = `${source}|${row0}|${col0}`
  let block = blocks.get(key)
  if (block) {
    blocks.delete(key)
  } else {
    const [, rows, cols] = store.values.shape
    const rowEnd = Math.min(row0 + height, rows)
    const colEnd = Math.min(col0 + width, cols)
    block = zarr
      .get(store.values, [
        null,
        zarr.slice(row0, rowEnd),
        zarr.slice(col0, colEnd),
      ])
      .then((chunk) => ({
        row0,
        col0,
        height: rowEnd - row0,
        width: colEnd - col0,
        data: chunk.data as ArrayLike<number>,
      }))
    block.catch(() => blocks.delete(key))
  }
  blocks.set(key, block)
  if (blocks.size > BLOCK_LIMIT) blocks.delete(blocks.keys().next().value!)
  return block
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

  const block = await readBlock(source, store, row, col)
  const cell = (row - block.row0) * block.width + (col - block.col0)
  const layerSize = block.height * block.width
  const read = (i: number) => {
    const raw = i < 0 ? store.fillValue : block.data[i * layerSize + cell]
    return raw === store.fillValue ? null : raw * store.scaleFactor
  }

  return {
    fdp: read(store.fdpIndex),
    fdpSe: read(store.fdpSeIndex),
    contribution: store.contributionIndices.map(read),
  }
}

// queryStorePoint's shape for the FDP store: the requested variables the point
// group holds, null for the rest
export const queryFdpValues = async (
  dataset: HazardDataset,
  variables: string[],
  lngLat: [number, number],
): Promise<Record<string, number | null>> => {
  const data = await queryFdpPoint(dataset.source, lngLat)
  const byName: Record<string, number | null> = {
    fdp: data?.fdp ?? null,
    fdp_se: data?.fdpSe ?? null,
  }
  return Object.fromEntries(
    variables.map((name) => [name, byName[name] ?? null]),
  )
}
