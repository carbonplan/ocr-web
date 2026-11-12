import * as zarr from 'zarrita'
import proj4 from 'proj4'
import { openIcechunkStore } from './icechunk'

// Point reads from the hazard stores with zarrita, independent of the render
// layer. Every store describes its finest grid with spatial:transform and
// proj metadata (on a multiscales layout's first level, or on the group), so
// one cell lookup serves them all; a read fetches the whole chunk under the
// point, and nearby points reuse it.

export type StoreRef = {
  source: string
  // 'icechunk' opens source as an Icechunk repo rather than a plain Zarr URL
  store?: 'icechunk'
}

type ReadableArray = zarr.Array<zarr.DataType, zarr.Readable>

export type Grid = {
  // path of the group holding the finest level's arrays
  asset: string
  // [row, col] of the cell under a lng/lat, or null off the grid
  locate: (lngLat: [number, number]) => [number, number] | null
}

const cached = <T>(
  cache: Map<string, Promise<T>>,
  key: string,
  open: () => Promise<T>,
): Promise<T> => {
  let entry = cache.get(key)
  if (!entry) {
    entry = open()
    // a failed open is tried again on the next read
    entry.catch(() => cache.delete(key))
    cache.set(key, entry)
  }
  return entry
}

const roots = new Map<string, Promise<zarr.Location<zarr.Readable>>>()

const rootOf = (ref: StoreRef) =>
  cached(roots, ref.source, async () =>
    zarr.root(
      ref.store === 'icechunk'
        ? await openIcechunkStore(ref.source)
        : new zarr.FetchStore(ref.source),
    ),
  )

const join = (...parts: string[]) => parts.filter(Boolean).join('/')

const groups = new Map<string, Promise<zarr.Group<zarr.Readable>>>()

export const openGroup = (ref: StoreRef, path = '') =>
  cached(groups, `${ref.source}|${path}`, async () =>
    zarr.open.v3((await rootOf(ref)).resolve(path), { kind: 'group' }),
  )

const arrays = new Map<string, Promise<ReadableArray>>()

// null where the store has no such array
export const openArray = (
  ref: StoreRef,
  path: string,
): Promise<ReadableArray | null> =>
  cached(arrays, `${ref.source}|${path}`, async () =>
    zarr.open.v3((await rootOf(ref)).resolve(path), { kind: 'array' }),
  ).catch(() => null)

const grids = new Map<string, Promise<Grid>>()

// The grid of the group at `path`: its multiscales layout's finest level, or
// the group's own spatial metadata.
export const openGrid = (ref: StoreRef, path = ''): Promise<Grid> =>
  cached(grids, `${ref.source}|${path}`, async () => {
    const attrs = (await openGroup(ref, path)).attrs as Record<string, unknown>
    const layout = (
      attrs.multiscales as { layout?: Record<string, unknown>[] } | undefined
    )?.layout
    const finest = layout?.[0]
    const transform = (finest?.['spatial:transform'] ??
      attrs['spatial:transform']) as number[] | undefined
    const shape = (finest?.['spatial:shape'] ?? attrs['spatial:shape']) as
      | [number, number]
      | undefined
    if (!transform || !shape)
      throw new Error(`${ref.source}/${path} has no spatial transform`)
    const code = attrs['proj:code']
    const converter =
      code === 'EPSG:4326'
        ? null
        : proj4(
            'EPSG:4326',
            (attrs['proj:wkt2'] as string | undefined) ?? String(code),
          )
    // affine [a, b, c, d, e, f]: x = a * col + c, y = e * row + f
    const [a, , c, , e, f] = transform
    return {
      asset: join(path, String(finest?.asset ?? '')),
      locate: (lngLat) => {
        const [x, y] = converter
          ? (converter.forward(lngLat) as [number, number])
          : lngLat
        const col = Math.floor((x - c) / a)
        const row = Math.floor((y - f) / e)
        return row >= 0 && row < shape[0] && col >= 0 && col < shape[1]
          ? [row, col]
          : null
      },
    }
  })

type Block = {
  row0: number
  col0: number
  height: number
  width: number
  data: ArrayLike<number>
}

// Decoded chunks by store, array and chunk origin, most recently used last,
// within a budget of decoded values.
const blocks = new Map<string, Promise<Block>>()
const blockSizes = new Map<string, number>()
const BLOCK_VALUE_BUDGET = 8_000_000
let blockValues = 0

const forget = (key: string) => {
  blocks.delete(key)
  blockValues -= blockSizes.get(key) ?? 0
  blockSizes.delete(key)
}

const readBlock = (
  key: string,
  array: ReadableArray,
  row: number,
  col: number,
): Promise<Block> => {
  const leading = array.shape.length - 2
  const [height, width] = array.chunks.slice(leading)
  const row0 = row - (row % height)
  const col0 = col - (col % width)
  const blockKey = `${key}|${row0}|${col0}`
  let block = blocks.get(blockKey)
  if (block) {
    blocks.delete(blockKey)
    blocks.set(blockKey, block)
    return block
  }
  const rowEnd = Math.min(row0 + height, array.shape[leading])
  const colEnd = Math.min(col0 + width, array.shape[leading + 1])
  block = zarr
    .get(array, [
      ...Array(leading).fill(null),
      zarr.slice(row0, rowEnd),
      zarr.slice(col0, colEnd),
    ])
    .then((chunk) => ({
      row0,
      col0,
      height: rowEnd - row0,
      width: colEnd - col0,
      data: (chunk as { data: ArrayLike<number> }).data,
    }))
  block.catch(() => forget(blockKey))
  blocks.set(blockKey, block)
  const size = array.shape
    .slice(0, leading)
    .reduce((n, d) => n * d, (rowEnd - row0) * (colEnd - col0))
  blockSizes.set(blockKey, size)
  blockValues += size
  while (blockValues > BLOCK_VALUE_BUDGET && blocks.size > 1) {
    forget(blocks.keys().next().value!)
  }
  return block
}

// Every value at a cell along the array's leading dimensions (one for a 2D
// array), decoded: scale_factor applied, _FillValue and NaN as null. Null
// where the store has no such array.
export const readCell = async (
  ref: StoreRef,
  path: string,
  [row, col]: [number, number],
): Promise<(number | null)[] | null> => {
  const array = await openArray(ref, path)
  if (!array) return null
  const attrs = array.attrs as Record<string, unknown>
  const scale = typeof attrs.scale_factor === 'number' ? attrs.scale_factor : 1
  const fill = typeof attrs._FillValue === 'number' ? attrs._FillValue : null
  const block = await readBlock(`${ref.source}|${path}`, array, row, col)
  const layer = block.height * block.width
  const cell = (row - block.row0) * block.width + (col - block.col0)
  const count = block.data.length / layer
  return Array.from({ length: count }, (_, i) => {
    const raw = Number(block.data[i * layer + cell])
    return raw === fill || !Number.isFinite(raw) ? null : raw * scale
  })
}

const coordinates = new Map<string, Promise<number[]>>()

// A 1D coordinate array's values, such as return_period
export const readCoordinate = (ref: StoreRef, path: string) =>
  cached(coordinates, `${ref.source}|${path}`, async () => {
    const array = await openArray(ref, path)
    if (!array) throw new Error(`${ref.source} has no ${path}`)
    const { data } = (await zarr.get(array)) as { data: ArrayLike<number> }
    return Array.from(data, Number)
  })
