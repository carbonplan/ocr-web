import {
  parquetMetadataAsync,
  parquetReadObjects,
  parquetSchema,
  readColumnIndex,
  readOffsetIndex,
} from 'hyparquet'
import type { AsyncBuffer, FileMetaData, SchemaTree } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

// Region files are GeoParquet with a bbox covering, written with a row cap per
// page so every column breaks pages at the same rows. A point lookup reads the
// bbox page statistics, then the requested columns for the candidate pages
// only, and keeps the row whose polygon contains the point.

type Polygon = number[][][]
export type RegionGeometry =
  | { type: 'Polygon'; coordinates: Polygon }
  | { type: 'MultiPolygon'; coordinates: Polygon[] }

export type RegionRow = Record<string, unknown>

type PageBounds = {
  rowStart: number
  rowEnd: number
  xmin: number
  ymin: number
  xmax: number
  ymax: number
  // GEOID range, when the file keeps GEOID statistics
  geoidMin?: string
  geoidMax?: string
}

export type RegionFile = {
  file: AsyncBuffer
  metadata: FileMetaData
  groupStarts: number[]
  pageBounds: Map<number, Promise<PageBounds[]>>
  // every row's GEOID, read once when the file is not in GEOID order
  geoids?: Promise<string[]>
}

const BBOX = ['xmin', 'ymin', 'xmax', 'ymax'] as const
// The footer and, for most region files, the page indexes before it fit here.
const TAIL_BYTES = 16 * 1024
// Files this small are read in one request and queried in memory.
const WHOLE_FILE_BYTES = 128 * 1024

/** An AsyncBuffer that serves any range inside one it has already fetched. */
const rangeCache = (file: AsyncBuffer): AsyncBuffer => {
  const spans: { start: number; end: number; data: Promise<ArrayBuffer> }[] = []
  return {
    byteLength: file.byteLength,
    slice(start, end = file.byteLength) {
      const span = spans.find((s) => s.start <= start && end <= s.end)
      if (span) {
        return span.data.then((data) =>
          data.slice(start - span.start, end - span.start),
        )
      }
      const data = Promise.resolve(file.slice(start, end))
      const entry = { start, end, data }
      spans.push(entry)
      data.catch(() => spans.splice(spans.indexOf(entry), 1))
      return data
    },
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

const INDEXED = ['GEOID', ...BBOX.map((name) => `bbox.${name}`)]

// Index entries this close together are fetched in one request.
const INDEX_GAP = 8 * 1024

/** Fetch, in as few requests as their placement allows, a row group's column
 * indexes for the indexed columns and offset indexes for those and `read`. */
const fetchGroupIndexes = (
  region: RegionFile,
  group: number,
  read: string[],
) => {
  const ranges: [number, number][] = []
  for (const chunk of region.metadata.row_groups[group].columns) {
    const path = chunk.meta_data?.path_in_schema ?? []
    const indexed = INDEXED.includes(path.join('.'))
    const entries = [
      indexed && [chunk.column_index_offset, chunk.column_index_length],
      (indexed || read.includes(path[0])) && [
        chunk.offset_index_offset,
        chunk.offset_index_length,
      ],
    ] as const
    for (const entry of entries) {
      if (!entry || entry[0] === undefined || !entry[1]) continue
      ranges.push([Number(entry[0]), Number(entry[0]) + Number(entry[1])])
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range[0] - last[1] <= INDEX_GAP)
      last[1] = Math.max(last[1], range[1])
    else merged.push([...range])
  }
  return Promise.all(merged.map(([a, b]) => region.file.slice(a, b)))
}

const readPageBounds = async (
  region: RegionFile,
  group: number,
  read: string[],
): Promise<PageBounds[]> => {
  const { file, metadata } = region
  const tree = parquetSchema(metadata)
  const chunks = metadata.row_groups[group].columns
  await fetchGroupIndexes(region, group, read)
  const chunkFor = (name: string) => {
    const chunk = chunks.find(
      (c) => c.meta_data?.path_in_schema.join('.') === `bbox.${name}`,
    )
    if (!chunk?.column_index_offset || !chunk.offset_index_offset) {
      throw new Error(`region file has no page index for bbox.${name}`)
    }
    return chunk
  }
  const view = async (offset: bigint | undefined, length = 0) => {
    const start = Number(offset)
    return {
      view: new DataView(await file.slice(start, start + length)),
      offset: 0,
    }
  }
  const indexes = await Promise.all(
    BBOX.map(async (name) => {
      const chunk = chunkFor(name)
      return readColumnIndex(
        await view(chunk.column_index_offset, chunk.column_index_length),
        leaf(tree, ['bbox', name]).element,
      )
    }),
  )
  const geoidChunk = chunks.find(
    (c) => c.meta_data?.path_in_schema.join('.') === 'GEOID',
  )
  const geoids = geoidChunk?.column_index_offset
    ? readColumnIndex(
        await view(
          geoidChunk.column_index_offset,
          geoidChunk.column_index_length,
        ),
        leaf(tree, ['GEOID']).element,
      )
    : null
  const xmin = chunkFor('xmin')
  const locations = readOffsetIndex(
    await view(xmin.offset_index_offset, xmin.offset_index_length),
  ).page_locations
  const groupStart = region.groupStarts[group]
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
    geoidMin: geoids ? String(geoids.min_values[i]) : undefined,
    geoidMax: geoids ? String(geoids.max_values[i]) : undefined,
  }))
}

export const openRegionFile = async (
  source: AsyncBuffer,
): Promise<RegionFile> => {
  const file = rangeCache(source)
  const tail =
    file.byteLength <= WHOLE_FILE_BYTES
      ? file.byteLength
      : Math.min(TAIL_BYTES, file.byteLength)
  await file.slice(file.byteLength - tail, file.byteLength)
  const metadata = await parquetMetadataAsync(file, { initialFetchSize: tail })
  let groupStart = 0
  const groupStarts = metadata.row_groups.map((group) => {
    const start = groupStart
    groupStart += Number(group.num_rows)
    return start
  })
  return { file, metadata, groupStarts, pageBounds: new Map() }
}

// `read` names the columns the first lookup in the group reads, whose offset
// indexes are fetched with the page bounds.
const pagesOf = (region: RegionFile, group: number, read: string[]) => {
  let pages = region.pageBounds.get(group)
  if (!pages) {
    pages = readPageBounds(region, group, read)
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
    throw new Error('region file has no bbox statistics')
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

/** Reads `columns` that the file has; levels differ, e.g. only some have NAME. */
export const readRows = (
  region: RegionFile,
  rowStart: number,
  rowEnd: number,
  columns: string[],
): Promise<RegionRow[]> =>
  parquetReadObjects({
    file: region.file,
    metadata: region.metadata,
    rowStart,
    rowEnd,
    columns: columns.filter((name) =>
      parquetSchema(region.metadata).children.some(
        (child) => child.element.name === name,
      ),
    ),
    compressors,
    useOffsetIndex: true,
  })

export type Found = RegionRow & { geometry: RegionGeometry }

// `columns` and geometry of the candidate pages in one round of reads, then
// the first row `matches` accepts.
const findInPages = async (
  region: RegionFile,
  groups: number[],
  isCandidate: (page: PageBounds) => boolean,
  matches: (row: Found) => boolean,
  columns: string[],
): Promise<Found | null> => {
  const read = [...new Set([...columns, 'geometry'])]
  const candidates = (
    await Promise.all(groups.map((g) => pagesOf(region, g, read)))
  )
    .flat()
    .filter(isCandidate)
  const batches = await Promise.all(
    mergeRanges(candidates).map(([start, end]) =>
      readRows(region, start, end, read),
    ),
  )
  return (batches.flat() as Found[]).find(matches) ?? null
}

const allGroups = (region: RegionFile) =>
  region.metadata.row_groups.map((_, g) => g)

/** Row groups whose GEOID statistics can hold `geoid`. */
const groupsWith = (region: RegionFile, geoid: string) =>
  allGroups(region).filter((g) => {
    const stats = region.metadata.row_groups[g].columns.find(
      (c) => c.meta_data?.path_in_schema.join('.') === 'GEOID',
    )?.meta_data?.statistics
    const min = stats?.min_value
    const max = stats?.max_value
    return (
      min === undefined ||
      max === undefined ||
      (String(min) <= geoid && geoid <= String(max))
    )
  })

/** The row whose polygon contains (x, y), with `columns` and its geometry. */
export const findRegion = (
  region: RegionFile,
  x: number,
  y: number,
  columns: string[],
): Promise<Found | null> =>
  findInPages(
    region,
    allGroups(region).filter((g) => groupContains(region.metadata, g, x, y)),
    (p) => p.xmin <= x && x <= p.xmax && p.ymin <= y && y <= p.ymax,
    (row) => containsPoint(row.geometry, x, y),
    columns,
  )

// Pages whose GEOID ranges ascend without overlapping are in GEOID order.
const inGeoidOrder = (pages: PageBounds[]) =>
  pages.every(
    (page, i) =>
      page.geoidMin !== undefined &&
      page.geoidMax !== undefined &&
      (i === 0 || pages[i - 1].geoidMax! <= page.geoidMin),
  )

/** The row with this GEOID, with `columns` and its geometry. A file in GEOID
 * order finds its page from the page statistics; any other file reads its
 * GEOID column once. `geoidOf` reads a row's GEOID from `columns`. */
export const findRegionById = async (
  region: RegionFile,
  geoid: string,
  columns: string[],
  geoidOf: (row: RegionRow) => string,
): Promise<Found | null> => {
  const groups = groupsWith(region, geoid)
  const read = [...new Set([...columns, 'geometry'])]
  const pages = (
    await Promise.all(groups.map((g) => pagesOf(region, g, read)))
  ).flat()
  if (inGeoidOrder(pages)) {
    return findInPages(
      region,
      groups,
      (p) => p.geoidMin! <= geoid && geoid <= p.geoidMax!,
      (row) => geoidOf(row) === geoid,
      columns,
    )
  }
  if (!region.geoids) {
    const rows = Number(region.metadata.num_rows)
    region.geoids = readRows(region, 0, rows, ['GEOID']).then((all) =>
      all.map((row) => String(row.GEOID)),
    )
    region.geoids.catch(() => (region.geoids = undefined))
  }
  const row = (await region.geoids).indexOf(geoid)
  if (row === -1) return null
  const [found] = await readRows(region, row, row + 1, [
    ...new Set([...columns, 'geometry']),
  ])
  return (found as Found) ?? null
}
