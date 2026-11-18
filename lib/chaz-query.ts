import { openGrid, readCell, readCoordinate } from './zarr-point'

// Point reader for the CHAZ v2 stores, which carry every band the wind detail
// panel shows, at the native ~9 km grid.

const VARS_2D = [
  'ead',
  'ead_lower',
  'ead_upper',
  'rp_exceed_33',
  'rp_exceed_50',
] as const
const VARS_3D = ['damage_fraction', 'wind_speed'] as const
// GCM min/max envelope, carried only by the median (future) stores
const VARS_3D_BOUNDS = ['wind_speed_lower', 'wind_speed_upper'] as const

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
  // min/max across the GCM members; null when the store has no member spread
  windSpeedLower: (number | null)[] | null
  windSpeedUpper: (number | null)[] | null
}

// null when the point falls outside the grid
export const queryChazPoint = async (
  source: string,
  lngLat: [number, number],
): Promise<ChazPointData | null> => {
  const ref = { source }
  const grid = await openGrid(ref)
  const cell = grid.locate(lngLat)
  if (!cell) return null
  const read = (name: string) => readCell(ref, `${grid.asset}/${name}`, cell)

  const [scalars, curves, bounds, returnPeriods] = await Promise.all([
    Promise.all(VARS_2D.map(read)),
    Promise.all(VARS_3D.map(read)),
    Promise.all(VARS_3D_BOUNDS.map(read)),
    readCoordinate(ref, `${grid.asset}/return_period`),
  ])
  const [ead, eadLower, eadUpper, rpExceed33, rpExceed50] = scalars.map(
    (column) => column?.[0] ?? null,
  )
  const [damageFraction, windSpeed] = curves.map((column) => column ?? [])
  const [windSpeedLower, windSpeedUpper] = bounds.every(Boolean)
    ? bounds
    : [null, null]

  return {
    ead,
    eadLower,
    eadUpper,
    rpExceed33,
    rpExceed50,
    returnPeriods,
    damageFraction,
    windSpeed,
    windSpeedLower,
    windSpeedUpper,
  }
}
