import * as zarr from 'zarrita'
import proj4 from 'proj4'

// Point reader for the FDP stores, which carry the probability, its standard
// error and the per-driver contributions on one grid. Reads level 0 (the
// native 100 m grid) directly with zarrita, independent of the render layer's
// lifecycle, so every variable is readable whichever one the map shows.

export type FdpPointData = {
  // probabilities in [0, 1] (multiply by unitScale for display)
  fdp: number | null
  fdpSe: number | null
  // aligned along the driver dimension, in FDP_DRIVERS order
  contribution: (number | null)[]
}

type NumericArray = zarr.Array<zarr.NumberDataType, zarr.FetchStore>

type OpenedStore = {
  // lng/lat to the store's projected x/y
  project: (point: [number, number]) => [number, number]
  // [x pixel size, 0, x origin, 0, y pixel size, y origin], y size negative
  transform: number[]
  shape: [number, number]
  fdp: NumericArray
  fdpSe: NumericArray
  contribution: NumericArray
  // contribution is stored as scaled int16
  scaleFactor: number
  fillValue: number
}

const cache = new Map<string, Promise<OpenedStore>>()

const openStore = (source: string): Promise<OpenedStore> => {
  let entry = cache.get(source)
  if (!entry) {
    entry = (async () => {
      const root = zarr.root(new zarr.FetchStore(source))
      const group = await zarr.open.v3(root, { kind: 'group' })
      const attrs = group.attrs as Record<string, unknown>
      const openArray = (name: string) =>
        zarr.open.v3(root.resolve(`0/${name}`), {
          kind: 'array',
        }) as Promise<NumericArray>
      const [fdp, fdpSe, contribution] = await Promise.all(
        ['fdp', 'fdp_se', 'contribution'].map(openArray),
      )
      const contributionAttrs = contribution.attrs as Record<string, unknown>
      const converter = proj4('EPSG:4326', attrs['proj:wkt2'] as string)
      return {
        project: (point) => converter.forward(point) as [number, number],
        transform: attrs['spatial:transform'] as number[],
        shape: attrs['spatial:shape'] as [number, number],
        fdp,
        fdpSe,
        contribution,
        scaleFactor: (contributionAttrs.scale_factor as number) ?? 1,
        fillValue: contributionAttrs._FillValue as number,
      }
    })()
    // let a transient failure retry on the next query
    entry.catch(() => cache.delete(source))
    cache.set(source, entry)
  }
  return entry
}

const orNull = (value: number): number | null =>
  Number.isFinite(value) ? value : null

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

  const [fdp, fdpSe, contribution] = await Promise.all([
    zarr.get(store.fdp, [row, col]) as Promise<number>,
    zarr.get(store.fdpSe, [row, col]) as Promise<number>,
    zarr.get(store.contribution, [null, row, col]),
  ])

  return {
    fdp: orNull(fdp),
    fdpSe: orNull(fdpSe),
    contribution: Array.from(contribution.data as ArrayLike<number>, (raw) =>
      raw === store.fillValue ? null : raw * store.scaleFactor,
    ),
  }
}
