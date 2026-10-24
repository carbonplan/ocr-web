import {
  parquetMetadataAsync,
  parquetReadObjects,
  parquetSchema,
  readColumnIndex,
  readOffsetIndex,
} from 'hyparquet'
import type { AsyncBuffer, FileMetaData } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { coalescing, httpSource } from 'geoparquet-lod'

// Building rows for a region's download, read from the buildings LOD file's
// analytical columns. The file keeps GEOID statistics and a page index, and in
// Hilbert order a page covers a small area, so a region's GEOID prefix selects
// a few runs of pages in a few row groups.

export const SCORE_COLUMNS = [
  'rps_2011',
  'rps_2047',
  'bp_2011',
  'bp_2047',
  'crps_scott',
  'bp_2011_riley',
  'bp_2047_riley',
] as const

const COLUMNS = ['GEOID', ...SCORE_COLUMNS, 'geometry']

export type DownloadRow = {
  geoid: string
  lng: number
  lat: number
  scores: (number | null)[]
}

type Opened = { source: AsyncBuffer; metadata: FileMetaData }

// rows decoded at once; a run longer than this is read in pieces
const BATCH_ROWS = 262_144

/** Serves ranges inside ones it has fetched, and forgets a range whose
 * request failed so a retry asks again. */
const rangeCache = (source: AsyncBuffer): AsyncBuffer => {
  const spans: { start: number; end: number; data: Promise<ArrayBuffer> }[] = []
  return {
    byteLength: source.byteLength,
    slice(start, end = source.byteLength) {
      const span = spans.find((s) => s.start <= start && end <= s.end)
      if (span) {
        return span.data.then((d) =>
          d.slice(start - span.start, end - span.start),
        )
      }
      const entry = {
        start,
        end,
        data: Promise.resolve(source.slice(start, end)),
      }
      spans.push(entry)
      entry.data.catch(() => spans.splice(spans.indexOf(entry), 1))
      return entry.data
    },
  }
}

// The footer is kept per file; fetched pages are kept only while their row
// group is read, so memory follows one row group, not every download so far.
const opened = new Map<string, Promise<Opened>>()

const open = (url: string) => {
  let file = opened.get(url)
  if (!file) {
    file = (async () => {
      // ranges requested together are merged when the gap is cheaper than a request
      const source = coalescing(await httpSource([url]), {
        maxGap: 256 * 1024,
        minGap: 64 * 1024,
        windowMs: 5,
        maxRun: 16 * 1024 * 1024,
      })
      // geometry stays WKB; a download needs only the centroid
      const metadata = await parquetMetadataAsync(rangeCache(source), {
        initialFetchSize: 512 * 1024,
        geoparquet: false,
      })
      return { source, metadata }
    })()
    file.catch(() => opened.delete(url))
    opened.set(url, file)
  }
  return file
}

/** Area-weighted centroid of a WKB Polygon or MultiPolygon, holes subtracted.
 * A shape with no area falls back, as GEOS does, to the length-weighted
 * centroid of its rings, then to the mean of its points. */
export const wkbCentroid = (wkb: Uint8Array): [number, number] => {
  const view = new DataView(wkb.buffer, wkb.byteOffset, wkb.byteLength)
  let offset = 0
  let area = 0
  let sx = 0
  let sy = 0
  let length = 0
  let lx = 0
  let ly = 0
  let points = 0
  let px = 0
  let py = 0
  const readGeometry = () => {
    const little = view.getUint8(offset) === 1
    const type = view.getUint32(offset + 1, little) % 1000
    offset += 5
    const count = view.getUint32(offset, little)
    offset += 4
    if (type === 6) {
      for (let p = 0; p < count; p++) readGeometry()
      return
    }
    if (type !== 3) throw new Error(`unsupported WKB geometry type ${type}`)
    for (let r = 0; r < count; r++) {
      const size = view.getUint32(offset, little)
      offset += 4
      let a = 0
      let cx = 0
      let cy = 0
      const x0 = view.getFloat64(offset, little)
      const y0 = view.getFloat64(offset + 8, little)
      for (let i = 0; i < size - 1; i++) {
        const at = offset + i * 16
        const x1 = view.getFloat64(at, little) - x0
        const y1 = view.getFloat64(at + 8, little) - y0
        const x2 = view.getFloat64(at + 16, little) - x0
        const y2 = view.getFloat64(at + 24, little) - y0
        const cross = x1 * y2 - x2 * y1
        a += cross
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross
        const segment = Math.hypot(x2 - x1, y2 - y1)
        length += segment
        lx += segment * ((x1 + x2) / 2 + x0)
        ly += segment * ((y1 + y2) / 2 + y0)
      }
      for (let i = 0; i < size; i++) {
        px += view.getFloat64(offset + i * 16, little)
        py += view.getFloat64(offset + i * 16 + 8, little)
      }
      points += size
      offset += size * 16
      // the exterior ring adds area and holes remove it, whatever their winding
      const sign = (r === 0 ? 1 : -1) * Math.sign(a)
      area += sign * a
      sx += sign * (cx / 3 + x0 * a)
      sy += sign * (cy / 3 + y0 * a)
    }
  }
  readGeometry()
  if (area > 0) return [sx / area, sy / area]
  if (length > 0) return [lx / length, ly / length]
  return points ? [px / points, py / points] : [NaN, NaN]
}

export type Bbox = [number, number, number, number]

const BBOX = ['xmin', 'ymin', 'xmax', 'ymax'] as const

type Runs = [number, number][]

const intersect = (a: Runs, b: Runs): Runs => {
  const out: Runs = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    const from = Math.max(a[i][0], b[j][0])
    const to = Math.min(a[i][1], b[j][1])
    if (from < to) out.push([from, to])
    if (a[i][1] < b[j][1]) i++
    else j++
  }
  return out
}

/** Row ranges of a row group whose pages may hold a building with this GEOID
 * prefix inside `bbox`. A page's GEOID range alone is not enough: a page on a
 * state line spans every GEOID between its states, so its bbox must also meet
 * the region's. */
const candidateRuns = async (
  file: AsyncBuffer,
  metadata: FileMetaData,
  group: number,
  start: number,
  prefix: string,
  [west, south, east, north]: Bbox,
): Promise<Runs> => {
  const rows = Number(metadata.row_groups[group].num_rows)
  const columns = metadata.row_groups[group].columns
  const chunk = (path: string) =>
    columns.find((c) => c.meta_data?.path_in_schema.join('.') === path)
  const high = `${prefix}\uffff`
  const geoid = chunk('GEOID')
  const bbox = BBOX.map((k) => chunk(`bbox.${k}`))
  const stat = (
    c: (typeof columns)[number] | undefined,
    k: 'min_value' | 'max_value',
  ) => c?.meta_data?.statistics?.[k]
  const outside = (
    lo: unknown,
    hi: unknown,
    test: (lo: unknown, hi: unknown) => boolean,
  ) => lo !== undefined && hi !== undefined && test(lo, hi)
  if (
    outside(
      stat(geoid, 'min_value'),
      stat(geoid, 'max_value'),
      (lo, hi) => String(hi) < prefix || String(lo) >= high,
    ) ||
    Number(stat(bbox[0], 'min_value')) > east ||
    Number(stat(bbox[1], 'min_value')) > north ||
    Number(stat(bbox[2], 'max_value')) < west ||
    Number(stat(bbox[3], 'max_value')) < south
  )
    return []
  const indexed = [geoid, ...bbox]
  if (indexed.some((c) => !c?.column_index_offset || !c.offset_index_offset))
    throw new Error('buildings file has no GEOID or bbox page index')
  // page statistics of GEOID and the bbox, and page locations of the columns
  // read next; fetched together, so the coalescing reader merges what is close
  const read = columns.filter((c) =>
    COLUMNS.includes(c.meta_data?.path_in_schema[0] ?? ''),
  )
  const range = (offset: bigint | undefined, length = 0) =>
    file.slice(Number(offset), Number(offset) + length)
  await Promise.all([
    ...indexed.map((c) =>
      range(c!.column_index_offset, c!.column_index_length),
    ),
    ...[...indexed, ...read].map((c) =>
      range(c!.offset_index_offset, c!.offset_index_length),
    ),
  ])
  const view = async (offset: bigint | undefined, length = 0) => ({
    view: new DataView(await range(offset, length)),
    offset: 0,
  })
  const tree = parquetSchema(metadata)
  const leaf = (path: string[]) =>
    path.reduce(
      (node, name) => node.children.find((c) => c.element.name === name)!,
      tree,
    ).element
  // a column's runs of pages that `keep` accepts, from its page statistics
  const runsOf = async (
    c: (typeof columns)[number],
    path: string[],
    keep: (min: unknown, max: unknown) => boolean,
  ): Promise<Runs> => {
    const index = readColumnIndex(
      await view(c.column_index_offset, c.column_index_length),
      leaf(path),
    )
    const pages = readOffsetIndex(
      await view(c.offset_index_offset, c.offset_index_length),
    ).page_locations
    const runs: Runs = []
    pages.forEach((page, i) => {
      if (!keep(index.min_values[i], index.max_values[i])) return
      const a = start + Number(page.first_row_index)
      const b =
        start +
        (i + 1 < pages.length ? Number(pages[i + 1].first_row_index) : rows)
      const last = runs[runs.length - 1]
      if (last && last[1] === a) last[1] = b
      else runs.push([a, b])
    })
    return runs
  }
  const all = await Promise.all([
    runsOf(
      geoid!,
      ['GEOID'],
      (lo, hi) => !(String(hi) < prefix || String(lo) >= high),
    ),
    runsOf(bbox[0]!, ['bbox', 'xmin'], (lo) => Number(lo) <= east),
    runsOf(bbox[1]!, ['bbox', 'ymin'], (lo) => Number(lo) <= north),
    runsOf(bbox[2]!, ['bbox', 'xmax'], (_, hi) => Number(hi) >= west),
    runsOf(bbox[3]!, ['bbox', 'ymax'], (_, hi) => Number(hi) >= south),
  ])
  return all.reduce(intersect)
}

/** Rows of every building in the LOD file at `url` whose GEOID starts with
 * `prefix`, a row group at a time; `bbox` bounds the region. */
export async function* regionBuildings(
  url: string,
  prefix: string,
  bbox: Bbox,
  signal?: AbortSignal,
): AsyncGenerator<DownloadRow[]> {
  const { source, metadata } = await open(url)
  let start = 0
  for (let g = 0; g < metadata.row_groups.length; g++) {
    signal?.throwIfAborted()
    const file = rangeCache(source)
    const runs = await candidateRuns(file, metadata, g, start, prefix, bbox)
    start += Number(metadata.row_groups[g].num_rows)
    // runs cut into pieces, read a batch of pieces at a time
    const pieces = runs.flatMap(([a, b]) => {
      const out: [number, number][] = []
      for (let at = a; at < b; at += BATCH_ROWS)
        out.push([at, Math.min(b, at + BATCH_ROWS)])
      return out
    })
    while (pieces.length) {
      const batch: [number, number][] = []
      let rows = 0
      while (
        pieces.length &&
        (!batch.length || rows + pieces[0][1] - pieces[0][0] <= BATCH_ROWS)
      ) {
        const piece = pieces.shift()!
        batch.push(piece)
        rows += piece[1] - piece[0]
      }
      signal?.throwIfAborted()
      const read = await Promise.all(
        batch.map(([rowStart, rowEnd]) =>
          parquetReadObjects({
            file,
            metadata,
            rowStart,
            rowEnd,
            columns: COLUMNS,
            useOffsetIndex: true,
            compressors,
            // byte arrays without a string type, the WKB, stay bytes
            utf8: false,
          }),
        ),
      )
      signal?.throwIfAborted()
      const out: DownloadRow[] = []
      for (const row of read.flat()) {
        const geoid = String(row.GEOID)
        if (!geoid.startsWith(prefix)) continue
        const [lng, lat] = wkbCentroid(row.geometry as Uint8Array)
        out.push({
          geoid,
          lng,
          lat,
          scores: SCORE_COLUMNS.map((c) =>
            row[c] === null || row[c] === undefined ? null : Number(row[c]),
          ),
        })
      }
      if (out.length) yield out
    }
  }
}

/** DuckDB's ROUND(x, 6): half away from zero. */
export const round6 = (x: number) =>
  (Math.sign(x) * Math.round(Math.abs(x) * 1e6)) / 1e6

/** A float32 value as DuckDB writes FLOAT: the shortest digits that read back
 * as the same float, fixed between 1e-4 and 1e16 and scientific outside. */
export const formatFloat = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return ''
  if (value === 0) return Object.is(value, -0) ? '-0.0' : '0.0'
  // a whole number prints exactly, as DuckDB does, even past float32's 2^24
  if (Number.isInteger(value) && Math.abs(value) < 1e16) return `${value}.0`
  // the shortest digits that read back as the same float32; a precision where
  // the value falls exactly halfway between two candidates is passed over
  const exact = Math.abs(value).toExponential().split('e')[0].replace('.', '')
  let digits = ''
  for (let p = 1; p <= 9 && !digits; p++) {
    const tie = exact.length === p + 1 && exact.endsWith('5')
    const candidate = value.toPrecision(p)
    if (!tie && Math.fround(Number(candidate)) === value) digits = candidate
  }
  if (!digits) digits = value.toPrecision(9)
  const exponent = Math.floor(Math.log10(Math.abs(Number(digits))))
  if (exponent < -4 || exponent >= 16) {
    const [mantissa, exp] = Number(digits).toExponential().split('e')
    const e = Number(exp)
    return `${mantissa}e${e < 0 ? '-' : '+'}${String(Math.abs(e)).padStart(2, '0')}`
  }
  const text = String(Number(digits))
  return text.includes('.') || text.includes('e') ? text : `${text}.0`
}

/** A double as DuckDB writes it: shortest digits, `.0` on whole numbers. */
const formatDouble = (value: number) => {
  const text = String(value)
  return /[.e]/.test(text) ? text : `${text}.0`
}

/** One CSV line in the columns `CSV_HEADER` names. */
export const CSV_HEADER = [
  'GEOID',
  'longitude',
  'latitude',
  ...SCORE_COLUMNS,
].join(',')

export const csvLine = (row: DownloadRow) =>
  [
    row.geoid,
    formatDouble(round6(row.lng)),
    formatDouble(round6(row.lat)),
    ...row.scores.map(formatFloat),
  ].join(',')

/** One GeoJSON Feature: the centroid and the scores. */
export const geojsonFeature = (row: DownloadRow) => {
  const properties = SCORE_COLUMNS.map(
    (name, i) => `,"${name}":${formatFloat(row.scores[i]) || 'null'}`,
  ).join('')
  return (
    `{"type":"Feature","geometry":{"type":"Point","coordinates":[` +
    `${formatDouble(round6(row.lng))},${formatDouble(round6(row.lat))}]},` +
    `"properties":{"GEOID":"${row.geoid}"${properties}}}`
  )
}
