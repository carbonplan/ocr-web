import * as zarr from 'zarrita'

// Point reader for the CHAZ v2 stores, which carry every band the wind detail
// panel shows. Reads level 0 (the native ~9 km grid) directly with zarrita,
// independent of the render layer's lifecycle.

const VARS_2D = [
  'ead',
  'ead_lower',
  'ead_upper',
  'rp_exceed_33',
  'rp_exceed_50',
] as const
const VARS_3D = ['damage_fraction', 'wind_speed'] as const

export type ChazPointData = {
  // fractions per year (multiply by unitScale for display)
  ead: number | null
  eadLower: number | null
  eadUpper: number | null
  // years between threshold exceedances
  rpExceed33: number | null
  rpExceed50: number | null
  // aligned along the return_period dimension
  returnPeriods: number[]
  damageFraction: (number | null)[]
  windSpeed: (number | null)[]
}

type NumericArray = zarr.Array<zarr.NumberDataType, zarr.FetchStore>

type OpenedStore = {
  lat: number[]
  lon: number[]
  returnPeriods: number[]
  arrays: Record<string, NumericArray>
}

const cache = new Map<string, Promise<OpenedStore>>()

const openStore = (source: string): Promise<OpenedStore> => {
  let entry = cache.get(source)
  if (!entry) {
    entry = (async () => {
      const root = zarr.root(new zarr.FetchStore(source))
      const names = [...VARS_2D, ...VARS_3D]
      const opened = await Promise.all(
        ['lat', 'lon', 'return_period', ...names].map(
          (name) =>
            zarr.open.v3(root.resolve(`0/${name}`), {
              kind: 'array',
            }) as Promise<NumericArray>,
        ),
      )
      const [latArr, lonArr, rpArr, ...varArrs] = opened
      const [lat, lon, rp] = await Promise.all(
        [latArr, lonArr, rpArr].map((arr) => zarr.get(arr)),
      )
      return {
        lat: Array.from(lat.data as ArrayLike<number>),
        lon: Array.from(lon.data as ArrayLike<number>),
        returnPeriods: Array.from(rp.data as ArrayLike<number>),
        arrays: Object.fromEntries(names.map((name, i) => [name, varArrs[i]])),
      }
    })()
    // let a transient failure retry on the next query
    entry.catch(() => cache.delete(source))
    cache.set(source, entry)
  }
  return entry
}

// null when the point falls outside the grid by more than half a cell
const nearestIndex = (coords: number[], value: number): number | null => {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < coords.length; i++) {
    const dist = Math.abs(coords[i] - value)
    if (dist < bestDist) {
      best = i
      bestDist = dist
    }
  }
  const step = Math.abs(coords[1] - coords[0])
  return bestDist <= step / 2 ? best : null
}

const orNull = (value: number): number | null =>
  Number.isFinite(value) ? value : null

export const queryChazPoint = async (
  source: string,
  [lng, lat]: [number, number],
): Promise<ChazPointData | null> => {
  const store = await openStore(source)
  const iy = nearestIndex(store.lat, lat)
  const ix = nearestIndex(store.lon, lng)
  if (iy === null || ix === null) return null

  const [scalars, curves] = await Promise.all([
    Promise.all(
      VARS_2D.map((name) => zarr.get(store.arrays[name], [iy, ix])),
    ) as Promise<number[]>,
    Promise.all(
      VARS_3D.map((name) => zarr.get(store.arrays[name], [null, iy, ix])),
    ),
  ])
  const [ead, eadLower, eadUpper, rpExceed33, rpExceed50] = scalars
  const [damageFraction, windSpeed] = curves.map((chunk) =>
    Array.from(chunk.data as ArrayLike<number>, orNull),
  )

  return {
    ead: orNull(ead),
    eadLower: orNull(eadLower),
    eadUpper: orNull(eadUpper),
    rpExceed33: orNull(rpExceed33),
    rpExceed50: orNull(rpExceed50),
    returnPeriods: store.returnPeriods,
    damageFraction,
    windSpeed,
  }
}
