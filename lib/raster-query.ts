import type { ZarrLayer } from '@carbonplan/zarr-layer'

// Unique per dataset because removing and re-adding a custom layer under one id
// in a single frame leaves the new layer uninitialized.
export const getZarrLayerId = (source: string, variable: string): string =>
  `zarr-raster-layer-${source.split('/').pop()}-${variable}`

// 'finest' keeps the value independent of the zoom the point was picked from
export const queryRasterPoint = async (
  layer: ZarrLayer,
  variable: string,
  [lng, lat]: [number, number],
  signal?: AbortSignal,
): Promise<number | null> => {
  const result = await layer.queryData(
    { type: 'Point', coordinates: [lng, lat] },
    undefined,
    { signal, includeSpatialCoordinates: false, level: 'finest' },
  )
  const values = result[variable]
  if (!Array.isArray(values) || values.length === 0) return null
  const value = values[0]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
