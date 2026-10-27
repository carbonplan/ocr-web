import type { AsyncBuffer } from 'hyparquet'
import {
  containsPoint,
  findRegion,
  findRegionById,
  Found,
  openRegionFile,
  readRows,
  RegionFile,
  RegionGeometry,
  RegionRow,
} from './region-query'
import {
  DATA_URLS,
  GEOGRAPHY_ATTRIBUTE_KEYS,
  GEOGRAPHY_MIN_ZOOM,
} from './config'
import { Geography, GeographyKey } from '@/types/location'

export type ActiveGeographies = Record<GeographyKey, Geography | null>

// The values the tool shows; the files hold every summary column.
const COLUMNS = [
  'GEOID',
  'NAME',
  'building_count',
  'rps_2011_median',
  'rps_2047_median',
  'risk_score_2011_hist',
  'risk_score_2047_hist',
]

// Counties are partitioned by state, tracts and blocks by county; `geoid`
// is the region's own GEOID or, for a point lookup, its parent's.
const fileFor = (level: GeographyKey, geoid?: string): string | null => {
  const base = DATA_URLS.vector.regions
  if (level === 'nation') return `${base}/nation.parquet`
  if (level === 'state') return `${base}/states.parquet`
  if (!geoid) return null
  const state = `state_fips=${geoid.slice(0, 2)}`
  if (level === 'county') return `${base}/counties/${state}/data.parquet`
  if (geoid.length < 5) return null
  const dir = level === 'censusTract' ? 'tracts' : 'blocks'
  return `${base}/${dir}/${state}/county_fips=${geoid.slice(2, 5)}/data.parquet`
}

// Opening a file reads its tail, sized to hold the footer and page indexes of
// most files at the level; a file needing more reads the rest on demand.
const TAIL_BYTES: Record<GeographyKey, number> = {
  nation: 8 * 1024,
  state: 32 * 1024,
  county: 16 * 1024,
  censusTract: 16 * 1024,
  censusBlock: 32 * 1024,
}

/** A file sized by HEAD, then opened with one read of its tail. Browsers
 * send suffix ranges (`bytes=-N`) only after a CORS preflight, so the tail is
 * read by offset. A file that does not exist is null. */
const openSource = async (
  url: string,
  tailBytes: number,
): Promise<AsyncBuffer | null> => {
  const head = await fetch(url, { method: 'HEAD' })
  if (head.status === 404 || head.status === 403) return null
  const byteLength = Number(head.headers.get('Content-Length'))
  if (!head.ok || !Number.isSafeInteger(byteLength))
    throw new Error(`cannot size ${url}`)
  const from = Math.max(0, byteLength - tailBytes)
  const response = await fetch(url, {
    headers: { Range: `bytes=${from}-${byteLength - 1}` },
  })
  if (response.status !== 206 && response.status !== 200)
    throw new Error(`${url}: ${response.status}`)
  const tail = await response.arrayBuffer()
  if (tail.byteLength !== byteLength - from)
    throw new Error(`${url}: short tail read`)
  const tailStart = byteLength - tail.byteLength
  const fetchRange = async (start: number, end: number) => {
    const response = await fetch(url, {
      headers: { Range: `bytes=${start}-${end - 1}` },
    })
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    return response.arrayBuffer()
  }
  // Reads issued together, as a lookup's columns are, go out as one request
  // per run of nearby ranges: a lookup's columns sit in separate column
  // chunks, which in a small file are a few KB apart.
  let batch: Pending[] | null = null
  const flush = (pending: Pending[]) => {
    pending.sort((a, b) => a.start - b.start)
    let run: Pending[] = []
    const send = (parts: Pending[]) => {
      const start = parts[0].start
      const end = Math.max(...parts.map((p) => p.end))
      fetchRange(start, end).then(
        (data) =>
          parts.forEach((p) =>
            p.resolve(data.slice(p.start - start, p.end - start)),
          ),
        (error) => parts.forEach((p) => p.reject(error)),
      )
    }
    for (const part of pending) {
      const end = run.length ? Math.max(...run.map((p) => p.end)) : 0
      if (run.length && part.start - end > READ_GAP) {
        send(run)
        run = []
      }
      run.push(part)
    }
    if (run.length) send(run)
  }
  return {
    byteLength,
    slice(start, end = byteLength) {
      if (start >= tailStart)
        return Promise.resolve(tail.slice(start - tailStart, end - tailStart))
      return new Promise<ArrayBuffer>((resolve, reject) => {
        if (!batch) {
          const pending: Pending[] = (batch = [])
          setTimeout(() => {
            batch = null
            flush(pending)
          })
        }
        batch.push({ start, end, resolve, reject })
      })
    },
  }
}

type Pending = {
  start: number
  end: number
  resolve: (data: ArrayBuffer) => void
  reject: (error: unknown) => void
}

// Ranges this close are read in one request; the bytes between cost less
// than another round trip.
const READ_GAP = 16 * 1024

// Caches hold the most recently used entries; a session browsing many
// counties keeps a few files and outlines, not all of them.
const FILE_LIMIT = 24
const GEOMETRY_LIMIT = 32

const keep = <K, V>(map: Map<K, V>, key: K, value: V, limit: number) => {
  map.delete(key)
  map.set(key, value)
  if (map.size > limit) map.delete(map.keys().next().value as K)
}

// Opened files, by URL; null for a file that does not exist.
const files = new Map<string, Promise<RegionFile | null>>()

const openFile = (level: GeographyKey, url: string) => {
  let file = files.get(url)
  if (!file) {
    file = openSource(url, TAIL_BYTES[level]).then((source) =>
      source ? openRegionFile(source) : null,
    )
    file.catch(() => files.delete(url))
    keep(files, url, file, FILE_LIMIT)
  }
  return file
}

// Region geometries for the highlight, by level and GEOID.
const geometries = new Map<string, RegionGeometry>()
const geometryKey = (level: GeographyKey, geoid: string) => `${level}:${geoid}`

/** The outline of a region a lookup has returned; the nation's is read on demand. */
export const loadRegionGeometry = async (
  level: GeographyKey,
  geoid: string,
): Promise<RegionGeometry | null> => {
  const key = geometryKey(level, geoid)
  const known = geometries.get(key)
  if (known) {
    keep(geometries, key, known, GEOMETRY_LIMIT)
    return known
  }
  // an outline evicted since its lookup is read again by its GEOID
  const target = fileFor(level, geoid)
  const file = target ? await openFile(level, target) : null
  if (!file) return null
  const geometry =
    level === 'nation'
      ? (((await readRows(file, 0, 1, ['geometry']))[0]?.geometry as
          | RegionGeometry
          | undefined) ?? null)
      : ((await findRegionById(file, geoid, ['GEOID'], geoidOf))?.geometry ??
        null)
  if (geometry) keep(geometries, key, geometry, GEOMETRY_LIMIT)
  return geometry
}

const bounds = (geometry: RegionGeometry) => {
  let [xmin, ymin, xmax, ymax] = [Infinity, Infinity, -Infinity, -Infinity]
  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  for (const polygon of polygons) {
    for (const [x, y] of polygon[0]) {
      xmin = Math.min(xmin, x)
      ymin = Math.min(ymin, y)
      xmax = Math.max(xmax, x)
      ymax = Math.max(ymax, y)
    }
  }
  return [xmin, ymin, xmax, ymax]
}

const toGeography = (stats: RegionRow, extent: number[]): Geography => {
  const geography: Geography = {
    [GEOGRAPHY_ATTRIBUTE_KEYS.building_count]: Number(stats.building_count),
    [GEOGRAPHY_ATTRIBUTE_KEYS.rps_2011_median]: Number(stats.rps_2011_median),
    [GEOGRAPHY_ATTRIBUTE_KEYS.rps_2047_median]: Number(stats.rps_2047_median),
    [GEOGRAPHY_ATTRIBUTE_KEYS.risk_score_2011_hist]: JSON.stringify(
      stats.risk_score_2011_hist,
    ),
    [GEOGRAPHY_ATTRIBUTE_KEYS.risk_score_2047_hist]: JSON.stringify(
      stats.risk_score_2047_hist,
    ),
    [GEOGRAPHY_ATTRIBUTE_KEYS.geoid]: String(stats.GEOID),
    [GEOGRAPHY_ATTRIBUTE_KEYS.bbox]: JSON.stringify(extent),
  }
  if (stats.NAME !== undefined && stats.NAME !== null) {
    geography[GEOGRAPHY_ATTRIBUTE_KEYS.name] = String(stats.NAME)
  }
  return geography
}

// The last match per file; a point still inside it needs no reads.
const last = new Map<
  string,
  { geography: Geography; geometry: RegionGeometry }
>()

const remember = (level: GeographyKey, url: string, row: Found) => {
  const geography = toGeography(row, bounds(row.geometry))
  keep(
    geometries,
    geometryKey(level, geography[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]),
    row.geometry,
    GEOMETRY_LIMIT,
  )
  keep(last, url, { geography, geometry: row.geometry }, FILE_LIMIT)
  return geography
}

const lookup = async (
  level: GeographyKey,
  x: number,
  y: number,
  parentGeoid?: string,
): Promise<Geography | null> => {
  const target = fileFor(level, parentGeoid)
  if (!target) return null
  const cached = last.get(target)
  if (cached && containsPoint(cached.geometry, x, y)) return cached.geography
  const file = await openFile(level, target)
  const row = file ? await findRegion(file, x, y, COLUMNS) : null
  return row ? remember(level, target, row) : null
}

const geoidOf = (row: RegionRow) => String(row.GEOID)

const lookupById = async (
  level: GeographyKey,
  geoid: string,
): Promise<Geography | null> => {
  const target = fileFor(level, geoid)
  if (!target) return null
  const cached = last.get(target)
  if (cached?.geography[GEOGRAPHY_ATTRIBUTE_KEYS.geoid] === geoid)
    return cached.geography
  const file = await openFile(level, target)
  const row = file ? await findRegionById(file, geoid, COLUMNS, geoidOf) : null
  return row ? remember(level, target, row) : null
}

// The nation file holds one row, shown at every zoom.
let nation: Promise<Geography | null> | null = null

const readNation = async () => {
  const file = await openFile('nation', fileFor('nation')!)
  if (!file) throw new Error('no nation region file')
  const [row] = await readRows(file, 0, 1, [...COLUMNS, 'bbox'])
  if (!row) return null
  const bbox = row.bbox as Record<'xmin' | 'ymin' | 'xmax' | 'ymax', number>
  return toGeography(row, [bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax])
}

const nationOf = () => {
  if (!nation) {
    nation = readNation()
    nation.catch(() => (nation = null))
  }
  return nation
}

/** Read the nation row now, before the first lookup. */
export const prefetchRegions = () => {
  nationOf().catch(() => undefined)
}

// GEOID characters that name each level within a 15-digit block GEOID
const GEOID_LENGTH: Record<Exclude<GeographyKey, 'nation'>, number> = {
  state: 2,
  county: 5,
  censusTract: 11,
  censusBlock: 15,
}

const NONE: ActiveGeographies = {
  nation: null,
  state: null,
  county: null,
  censusTract: null,
  censusBlock: null,
}

/** The levels a panel showing `level` reads: the level itself and, for tracts
 * and blocks, their county, which names their downloads. */
const levelsFor = (level: GeographyKey): GeographyKey[] =>
  level === 'censusTract' || level === 'censusBlock'
    ? ['county', level]
    : level === 'nation'
      ? []
      : [level]

/** The regions a building belongs to, from its block GEOID, for a panel
 * showing `level`: exact, and each level looked up at once. */
export const lookupGeographiesById = async (
  blockGeoid: string,
  zoom: number,
  level: GeographyKey,
): Promise<ActiveGeographies> => {
  const wanted = levelsFor(level).filter((l) => zoom >= GEOGRAPHY_MIN_ZOOM[l])
  const [nationGeography, ...found] = await Promise.all([
    nationOf(),
    ...wanted.map((l) =>
      lookupById(
        l,
        blockGeoid.slice(0, GEOID_LENGTH[l as keyof typeof GEOID_LENGTH]),
      ),
    ),
  ])
  const out: ActiveGeographies = { ...NONE, nation: nationGeography }
  wanted.forEach((l, i) => (out[l] = found[i]))
  return out
}

/** The regions at a point, for a panel showing `level`. A county is found in
 * its state's file, a tract or block in its county's. */
export const lookupGeographies = async (
  lng: number,
  lat: number,
  zoom: number,
  level: GeographyKey,
): Promise<ActiveGeographies> => {
  const wanted = levelsFor(level).filter((l) => zoom >= GEOGRAPHY_MIN_ZOOM[l])
  const out: ActiveGeographies = { ...NONE }
  const nationGeography = nationOf()
  if (wanted.includes('state')) out.state = await lookup('state', lng, lat)
  if (wanted.includes('county')) {
    const state = await lookup('state', lng, lat)
    const stateGeoid = state?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]
    out.county = stateGeoid
      ? await lookup('county', lng, lat, stateGeoid)
      : null
    const countyGeoid = out.county?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]
    for (const l of wanted.filter(
      (l) => l === 'censusTract' || l === 'censusBlock',
    ))
      out[l] = countyGeoid ? await lookup(l, lng, lat, countyGeoid) : null
  }
  out.nation = await nationGeography
  return out
}
