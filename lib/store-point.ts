import * as zarr from 'zarrita'
import proj4 from 'proj4'
import { openIcechunkStore } from './icechunk'
import type { HazardDataset } from './hazards'

// Values at a point, read from a GeoZarr store's finest level with zarrita: the
// render layer reads only the variable it draws, and only while it is on the map.

type Base = {
  group: zarr.Group<zarr.Readable>
  // affine [a, b, c, d, e, f]: x = a * col + c, y = e * row + f
  transform: number[]
  shape: [number, number]
  project: (lngLat: [number, number]) => [number, number]
}

const bases = new Map<string, Promise<Base>>()

const openBase = (dataset: HazardDataset): Promise<Base> => {
  let base = bases.get(dataset.source)
  if (!base) {
    base = (async () => {
      const store =
        dataset.store === 'icechunk'
          ? await openIcechunkStore(dataset.source)
          : new zarr.FetchStore(dataset.source)
      const root = await zarr.open(zarr.root(store), { kind: 'group' })
      const attrs = root.attrs as Record<string, unknown>
      const layout = (
        attrs.multiscales as { layout?: Record<string, unknown>[] }
      )?.layout
      const finest = layout?.[0]
      const asset = String(finest?.asset ?? '')
      const transform = (finest?.['spatial:transform'] ??
        attrs['spatial:transform']) as number[] | undefined
      const shape = (finest?.['spatial:shape'] ?? attrs['spatial:shape']) as
        | [number, number]
        | undefined
      if (!transform || !shape)
        throw new Error(`${dataset.source} has no spatial transform`)
      const code = attrs['proj:code']
      const def = (attrs['proj:wkt2'] as string | undefined) ?? String(code)
      const project =
        code === 'EPSG:4326'
          ? (lngLat: [number, number]) => lngLat
          : (lngLat: [number, number]) =>
              proj4('EPSG:4326', def, lngLat) as [number, number]
      const group = asset
        ? await zarr.open(root.resolve(asset), { kind: 'group' })
        : root
      return { group, transform, shape, project }
    })()
    base.catch(() => bases.delete(dataset.source))
    bases.set(dataset.source, base)
  }
  return base
}

type Block = {
  row0: number
  col0: number
  width: number
  data: ArrayLike<number>
}

// Opened arrays, by source and variable; an array that fails to open is null,
// and is tried again on the next read.
const arrays = new Map<
  string,
  Promise<zarr.Array<zarr.DataType, zarr.Readable> | null>
>()

// Decoded chunks by source, variable and chunk index, most recently used last.
// A point read fetches its whole chunk anyway, so later points in it need none.
const blocks = new Map<string, Promise<Block>>()
const BLOCK_LIMIT = 16

const openArray = (
  dataset: HazardDataset,
  group: Base['group'],
  name: string,
) => {
  const key = `${dataset.source}|${name}`
  let array = arrays.get(key)
  if (!array) {
    array = zarr.open(group.resolve(name), { kind: 'array' }).catch(() => {
      arrays.delete(key)
      return null
    })
    arrays.set(key, array)
  }
  return array
}

const readBlock = async (
  dataset: HazardDataset,
  array: zarr.Array<zarr.DataType, zarr.Readable>,
  name: string,
  row: number,
  col: number,
): Promise<Block> => {
  const [height, width] = array.chunks
  const row0 = row - (row % height)
  const col0 = col - (col % width)
  const key = `${dataset.source}|${name}|${row0}|${col0}`
  let block = blocks.get(key)
  if (block) {
    blocks.delete(key)
  } else {
    const rowEnd = Math.min(row0 + height, array.shape[0])
    const colEnd = Math.min(col0 + width, array.shape[1])
    block = zarr
      .get(array, [zarr.slice(row0, rowEnd), zarr.slice(col0, colEnd)])
      .then((chunk) => ({
        row0,
        col0,
        width: colEnd - col0,
        data: (chunk as { data: ArrayLike<number> }).data,
      }))
    block.catch(() => blocks.delete(key))
  }
  blocks.set(key, block)
  if (blocks.size > BLOCK_LIMIT) blocks.delete(blocks.keys().next().value!)
  return block
}

/** Each of `variables` at `lngLat`; null outside the grid, where the store has
 * no such variable, or where the value is missing. */
export const queryStorePoint = async (
  dataset: HazardDataset,
  variables: string[],
  lngLat: [number, number],
): Promise<Record<string, number | null>> => {
  const base = await openBase(dataset)
  const [x, y] = base.project(lngLat)
  const [a, , c, , e, f] = base.transform
  const col = Math.floor((x - c) / a)
  const row = Math.floor((y - f) / e)
  const inside =
    row >= 0 && row < base.shape[0] && col >= 0 && col < base.shape[1]
  const values = await Promise.all(
    variables.map(async (name) => {
      if (!inside) return null
      const array = await openArray(dataset, base.group, name)
      if (!array) return null
      const block = await readBlock(dataset, array, name, row, col)
      const value =
        block.data[(row - block.row0) * block.width + (col - block.col0)]
      return Number.isFinite(value) ? value : null
    }),
  )
  return Object.fromEntries(variables.map((name, i) => [name, values[i]]))
}
