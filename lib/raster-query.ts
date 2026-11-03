import type { ZarrLayer } from '@carbonplan/zarr-layer'

// Unique per dataset because removing and re-adding a custom layer under one id
// in a single frame leaves the new layer uninitialized.
export const getZarrLayerId = (source: string, variable: string): string =>
  `zarr-raster-layer-${source.split('/').pop()}-${variable}`

const toFinite = (values: unknown): number | null => {
  if (!Array.isArray(values) || values.length === 0) return null
  const value = values[0]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

// 'finest' keeps the value independent of the zoom the point was picked from.
// With a selector, reads every listed slice along its dimension in one query,
// in the order given; a slice with no finite value comes back null.
export function queryRasterPoint(
  layer: ZarrLayer,
  variable: string,
  point: [number, number],
  signal?: AbortSignal,
): Promise<number | null>
export function queryRasterPoint(
  layer: ZarrLayer,
  variable: string,
  point: [number, number],
  signal: AbortSignal | undefined,
  selector: { dim: string; values: number[] },
): Promise<(number | null)[]>
export async function queryRasterPoint(
  layer: ZarrLayer,
  variable: string,
  [lng, lat]: [number, number],
  signal?: AbortSignal,
  selector?: { dim: string; values: number[] },
): Promise<number | null | (number | null)[]> {
  const result = await layer.queryData(
    { type: 'Point', coordinates: [lng, lat] },
    selector ? { [selector.dim]: selector.values } : undefined,
    { signal, includeSpatialCoordinates: false, level: 'finest' },
  )
  if (!selector) return toFinite(result[variable])
  // array selectors nest the values under each selected slice
  const nested = result[variable] as Record<number, unknown> | undefined
  return selector.values.map((slice) => toFinite(nested?.[slice]))
}
