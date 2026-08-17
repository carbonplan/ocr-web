import type { Map } from 'maplibre-gl'
import type { ZarrLayer } from '@carbonplan/zarr-layer'
import { onceMapIdle } from './map-utils'

// Unique per dataset because removing and re-adding a custom layer under one id
// in a single frame leaves the new layer uninitialized.
export const getZarrLayerId = (source: string, variable: string): string =>
  `zarr-raster-layer-${source.split('/').pop()}-${variable}`

// undefined until the layer has drawn a frame and picked a pyramid level; null
// where the store holds no data at the point
const readPoint = async (
  layer: ZarrLayer,
  variable: string,
  [lng, lat]: [number, number],
  signal?: AbortSignal,
): Promise<number | null | undefined> => {
  const result = await layer.queryData(
    { type: 'Point', coordinates: [lng, lat] },
    undefined,
    { signal, includeSpatialCoordinates: false },
  )
  const values = result[variable]
  if (!Array.isArray(values) || values.length === 0) return undefined
  const value = values[0]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

// Reads the rendered variable back off the render layer, which owns the store's
// projection. The value comes from the pyramid level on screen, so it is native
// at building zoom and a coarsened mean from further out.
export const queryRasterPoint = async (
  map: Map,
  layer: ZarrLayer,
  variable: string,
  point: [number, number],
  signal?: AbortSignal,
): Promise<number | null> => {
  const value = await readPoint(layer, variable, point, signal)
  if (value !== undefined) return value

  // a layer rebuilt under an existing selection, as a hazard switch does, has
  // its metadata but not yet the render pass that commits a pyramid level
  await onceMapIdle(map)
  if (signal?.aborted) return null
  return (await readPoint(layer, variable, point, signal)) ?? null
}
