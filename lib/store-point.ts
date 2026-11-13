import { StoreRef, cached, openArray, openGrid, readCell } from './zarr-point'

// Values at a point from a hazard store. A store with a `point` group packs
// every variable at a cell into one (layer, y, x) array, so they come from a
// single chunk; otherwise each variable is read from the finest level.

const pointLayers = new Map<string, Promise<string[] | null>>()

// Names along the store's point group `layer` dimension, or null without one
export const readPointLayers = (ref: StoreRef): Promise<string[] | null> =>
  cached(pointLayers, ref.source, async () => {
    const array = await openArray(ref, 'point/layer')
    const meanings = (array?.attrs as Record<string, unknown> | undefined)
      ?.flag_meanings
    return typeof meanings === 'string' ? meanings.split(' ') : null
  })

/** Each of `variables` at `lngLat`; null outside the grid, where the store has
 * no such 2D variable, or where the value is missing. */
export const queryStorePoint = async (
  ref: StoreRef,
  variables: string[],
  lngLat: [number, number],
): Promise<Record<string, number | null>> => {
  const layers = await readPointLayers(ref)
  if (layers) {
    const cell = (await openGrid(ref, 'point')).locate(lngLat)
    const values = cell ? await readCell(ref, 'point/values', cell) : null
    return Object.fromEntries(
      variables.map((name) => {
        const i = layers.indexOf(name)
        return [name, values && i >= 0 ? values[i] : null]
      }),
    )
  }
  const grid = await openGrid(ref)
  const cell = grid.locate(lngLat)
  const values = await Promise.all(
    variables.map(async (name) => {
      if (!cell) return null
      const column = await readCell(ref, `${grid.asset}/${name}`, cell)
      return column?.length === 1 ? column[0] : null
    }),
  )
  return Object.fromEntries(variables.map((name, i) => [name, values[i]]))
}
