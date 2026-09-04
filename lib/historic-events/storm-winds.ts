import * as zarr from 'zarrita'
import { HISTORIC_URLS } from '@/lib/config'
import { nearestIndex } from '@/lib/chaz-query'

// Per-storm peak winds modeled on the CHAZ grid for every IBTrACS storm since
// 1980 (ocr: input-data/vector/ibtracs/ibtracs_winds.py). The store is chunked
// with every storm in one chunk, so a point query is a single small fetch.

export type Storm = {
  sid: string
  name: string
  season: number
  basin: 'NA' | 'EP'
  start: string
  end: string
  // peak 1-min sustained wind anywhere along the track, m/s
  vmax: number
}

export type StormAtPoint = Storm & {
  // modeled peak 1-min sustained wind at the point, m/s (whole numbers)
  wind: number
}

type OpenedStore = {
  lat: number[]
  lon: number[]
  storms: Storm[]
  wind: zarr.Array<'uint8', zarr.FetchStore>
}

let cache: Promise<OpenedStore> | null = null

const openStore = (): Promise<OpenedStore> => {
  if (!cache) {
    cache = (async () => {
      const root = zarr.root(new zarr.FetchStore(HISTORIC_URLS.stormWinds))
      const [group, latArr, lonArr, wind] = await Promise.all([
        zarr.open.v3(root, { kind: 'group' }),
        zarr.open.v3(root.resolve('lat'), { kind: 'array' }),
        zarr.open.v3(root.resolve('lon'), { kind: 'array' }),
        zarr.open.v3(root.resolve('wind'), { kind: 'array' }) as Promise<
          zarr.Array<'uint8', zarr.FetchStore>
        >,
      ])
      const [lat, lon] = await Promise.all([zarr.get(latArr), zarr.get(lonArr)])
      return {
        lat: Array.from(lat.data as ArrayLike<number>),
        lon: Array.from(lon.data as ArrayLike<number>),
        storms: group.attrs.storms as Storm[],
        wind,
      }
    })()
    cache.catch(() => {
      cache = null
    })
  }
  return cache
}

// Storms that brought tropical-storm-force winds to the point's cell, strongest
// first; empty off the grid.
export const queryStormsAtPoint = async ([lng, lat]: [number, number]): Promise<
  StormAtPoint[]
> => {
  const store = await openStore()
  const iy = nearestIndex(store.lat, lat)
  const ix = nearestIndex(store.lon, lng)
  if (iy === null || ix === null) return []
  const column = await zarr.get(store.wind, [null, iy, ix])
  const winds = column.data as Uint8Array
  return store.storms
    .flatMap((storm, i) => (winds[i] > 0 ? [{ ...storm, wind: winds[i] }] : []))
    .sort((a, b) => b.wind - a.wind)
}
