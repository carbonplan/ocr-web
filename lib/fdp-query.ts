import { queryStorePoint, readPointLayers } from './store-point'
import type { StoreRef } from './zarr-point'

// Every FDP value at a point, from the store's point group: the probability,
// its standard error and each driver's contribution, whichever layer the map
// shows.

export type FdpPointData = {
  // probabilities in [0, 1] (multiply by unitScale for display)
  fdp: number | null
  fdpSe: number | null
  // aligned along the driver dimension, in FDP_DRIVERS order
  contribution: (number | null)[]
}

// null when the point falls outside the grid
export const queryFdpPoint = async (
  ref: StoreRef,
  point: [number, number],
): Promise<FdpPointData | null> => {
  const contributions = ((await readPointLayers(ref)) ?? []).filter((name) =>
    name.startsWith('contribution_'),
  )
  const values = await queryStorePoint(
    ref,
    ['fdp', 'fdp_se', ...contributions],
    point,
  )
  if (Object.values(values).every((value) => value === null)) return null
  return {
    fdp: values.fdp,
    fdpSe: values.fdp_se,
    contribution: contributions.map((name) => values[name]),
  }
}
