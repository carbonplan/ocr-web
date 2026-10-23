import {
  parquetMetadataAsync,
  parquetReadObjects,
  parquetSchema,
  readColumnIndex,
  readOffsetIndex,
} from 'hyparquet'
import type { AsyncBuffer, FileMetaData, SchemaTree } from 'hyparquet'

// Region files are GeoParquet with a bbox covering, written with a row cap per
// page so every column breaks pages at the same rows. A point lookup reads the
// bbox page statistics, then geometry for the candidate pages only, then the
// requested columns for the one region that contains the point.

type Polygon = number[][][]
export type RegionGeometry =
  | { type: 'Polygon'; coordinates: Polygon }
  | { type: 'MultiPolygon'; coordinates: Polygon[] }

export type RegionRow = Record<string, unknown> & { geometry: RegionGeometry }

type PageBounds = {
  rowStart: number
  rowEnd: number
  xmin: number
  ymin: number
  xmax: number
  ymax: number
}

export type RegionFile = {
  file: AsyncBuffer
  metadata: FileMetaData
  groupStarts: number[]
  pageBounds: Map<number, Promise<PageBounds[]>>
}

const BBOX = ['xmin', 'ymin', 'xmax', 'ymax'] as const
const FOOTER_PROBE = 16 * 1024
// Files this small are read in one request and queried in memory.
const WHOLE_FILE_BYTES = 512 * 1024

const memoized = (file: AsyncBuffer): AsyncBuffer => {
  const cache = new Map<string, Promise<ArrayBuffer>>()
  return {
    byteLength: file.byteLength,
    slice(start, end = file.byteLength) {
      const key = `${start}-${end}`
      let hit = cache.get(key)
      if (!hit) {
        hit = Promise.resolve(file.slice(start, end))
        hit.catch(() => cache.delete(key))
        cache.set(key, hit)
      }
      return hit
    },
  }
}

const inMemory = async (file: AsyncBuffer): Promise<AsyncBuffer> => {
  const buffer = await file.slice(0, file.byteLength)
  return {
    byteLength: file.byteLength,
    slice: (start, end) => buffer.slice(start, end),
  }
}

const leaf = (tree: SchemaTree, path: string[]): SchemaTree => {
  let node = tree
  for (const name of path) {
    const next = node.children.find((child) => child.element.name === name)
    if (!next) throw new Error(`region file has no ${path.join('.')} column`)
    node = next
  }
  return node
}

const readPageBounds = async (
  file: AsyncBuffer,
  metadata: FileMetaData,
  group: number,
  groupStart: number,
): Promise<PageBounds[]> => {
  const tree = parquetSchema(metadata)
  const chunks = metadata.row_groups[group].columns
  const chunkFor = (name: string) => {
    const chunk = chunks.find(
      (c) => c.meta_data?.path_in_schema.join('.') === `bbox.${name}`,
    )
    if (!chunk?.column_index_offset || !chunk.offset_index_offset) {
      throw new Error(`region file has no page index for bbox.${name}`)
    }
    return chunk
  }
  const ranges = BBOX.map((name) => {
    const chunk = chunkFor(name)
    return [
      Number(chunk.column_index_offset),
      Number(chunk.column_index_offset) + chunk.column_index_length!,
    ]
  })
  const xminChunk = chunkFor('xmin')
  const offsetStart = Number(xminChunk.offset_index_offset)
  const offsetEnd = offsetStart + xminChunk.offset_index_length!
  // Page indexes sit together before the footer; one request covers all five.
  const start = Math.min(offsetStart, ...ranges.map(([s]) => s))
  const end = Math.max(offsetEnd, ...ranges.map(([, e]) => e))
  const buffer = await file.slice(start, end)
  const view = (s: number, e: number) => ({
    view: new DataView(buffer, s - start, e - s),
    offset: 0,
  })
  const indexes = BBOX.map((name, i) =>
    readColumnIndex(
      view(ranges[i][0], ranges[i][1]),
      leaf(tree, ['bbox', name]).element,
    ),
  )
  const locations = readOffsetIndex(view(offsetStart, offsetEnd)).page_locations
  const groupRows = Number(metadata.row_groups[group].num_rows)
  return locations.map((page, i) => ({
    rowStart: groupStart + Number(page.first_row_index),
    rowEnd:
      groupStart +
      (i + 1 < locations.length
        ? Number(locations[i + 1].first_row_index)
        : groupRows),
    xmin: Number(indexes[0].min_values[i]),
    ymin: Number(indexes[1].min_values[i]),
    xmax: Number(indexes[2].max_values[i]),
    ymax: Number(indexes[3].max_values[i]),
  }))
}

export const openRegionFile = async (
  source: AsyncBuffer,
): Promise<RegionFile> => {
  const file =
    source.byteLength <= WHOLE_FILE_BYTES
      ? await inMemory(source)
      : memoized(source)
  const metadata = await parquetMetadataAsync(file, {
    initialFetchSize: FOOTER_PROBE,
  })
  let groupStart = 0
  const groupStarts = metadata.row_groups.map((group) => {
    const start = groupStart
    groupStart += Number(group.num_rows)
    return start
  })
  return { file, metadata, groupStarts, pageBounds: new Map() }
}

const pagesOf = (region: RegionFile, group: number) => {
  let pages = region.pageBounds.get(group)
  if (!pages) {
    pages = readPageBounds(
      region.file,
      region.metadata,
      group,
      region.groupStarts[group],
    )
    pages.catch(() => region.pageBounds.delete(group))
    region.pageBounds.set(group, pages)
  }
  return pages
}

const groupContains = (
  metadata: FileMetaData,
  group: number,
  x: number,
  y: number,
) => {
  const stat = (name: string, kind: 'min_value' | 'max_value') => {
    const chunk = metadata.row_groups[group].columns.find(
      (c) => c.meta_data?.path_in_schema.join('.') === `bbox.${name}`,
    )
    const value = chunk?.meta_data?.statistics?.[kind]
    return value === undefined ? undefined : Number(value)
  }
  const xmin = stat('xmin', 'min_value')
  const ymin = stat('ymin', 'min_value')
  const xmax = stat('xmax', 'max_value')
  const ymax = stat('ymax', 'max_value')
  if (
    xmin === undefined ||
    ymin === undefined ||
    xmax === undefined ||
    ymax === undefined
  )
    return true
  return xmin <= x && x <= xmax && ymin <= y && y <= ymax
}

const inRing = (x: number, y: number, ring: number[][]) => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

const inPolygon = (x: number, y: number, polygon: Polygon) =>
  inRing(x, y, polygon[0]) &&
  !polygon.slice(1).some((hole) => inRing(x, y, hole))

export const containsPoint = (
  geometry: RegionGeometry,
  x: number,
  y: number,
): boolean =>
  geometry.type === 'Polygon'
    ? inPolygon(x, y, geometry.coordinates)
    : geometry.coordinates.some((polygon) => inPolygon(x, y, polygon))

const mergeRanges = (pages: PageBounds[]) => {
  const ranges: [number, number][] = []
  for (const page of pages) {
    const last = ranges[ranges.length - 1]
    if (last && last[1] === page.rowStart) last[1] = page.rowEnd
    else ranges.push([page.rowStart, page.rowEnd])
  }
  return ranges
}

const readRows = (
  region: RegionFile,
  rowStart: number,
  rowEnd: number,
  columns: string[],
) =>
  parquetReadObjects({
    file: region.file,
    metadata: region.metadata,
    rowStart,
    rowEnd,
    columns,
    useOffsetIndex: true,
  })

export const findRegion = async (
  region: RegionFile,
  x: number,
  y: number,
  columns: string[],
): Promise<RegionRow | null> => {
  const groups = region.metadata.row_groups
    .map((_, g) => g)
    .filter((g) => groupContains(region.metadata, g, x, y))
  const candidates = (await Promise.all(groups.map((g) => pagesOf(region, g))))
    .flat()
    .filter((p) => p.xmin <= x && x <= p.xmax && p.ymin <= y && y <= p.ymax)
  const ranges = mergeRanges(candidates)
  const geometries = await Promise.all(
    ranges.map(([start, end]) => readRows(region, start, end, ['geometry'])),
  )
  for (const [r, rows] of geometries.entries()) {
    const hit = rows.findIndex((row) =>
      containsPoint(row.geometry as RegionGeometry, x, y),
    )
    if (hit === -1) continue
    const row = ranges[r][0] + hit
    const geometry = rows[hit].geometry as RegionGeometry
    const others = columns.filter((c) => c !== 'geometry')
    const [values] = others.length
      ? await readRows(region, row, row + 1, others)
      : [{}]
    return { ...values, geometry }
  }
  return null
}
