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

// `stats` is JSON with the values the tool shows, so a lookup reads one
// column for them rather than one per value.
const COLUMNS = ['stats']

type Stats = {
  GEOID: string
  building_count: number
  rps_2011_median: number
  rps_2047_median: number
  risk_score_2011_hist: number[]
  risk_score_2047_hist: number[]
  NAME?: string
}

// Byte size of every region file, keyed like the files: tracts and blocks by
// county GEOID. A county with no tracts or blocks has no entry.
type Manifest = {
  nation: number
  states: number
  counties: number
  tracts: Record<string, number>
  blocks: Record<string, number>
}

let manifest: Promise<Manifest> | null = null

const getManifest = () => {
  manifest ??= fetch(`${DATA_URLS.vector.regions}/manifest.json`).then(
    (response) => {
      if (!response.ok) throw new Error(`region manifest: ${response.status}`)
      return response.json()
    },
  )
  manifest.catch(() => (manifest = null))
  return manifest
}

const fileFor = (
  m: Manifest,
  level: GeographyKey,
  countyGeoid?: string,
): { url: string; byteLength: number } | null => {
  const base = DATA_URLS.vector.regions
  if (level === 'censusTract' || level === 'censusBlock') {
    const dir = level === 'censusTract' ? 'tracts' : 'blocks'
    const byteLength = countyGeoid ? m[dir][countyGeoid] : undefined
    if (!byteLength) return null
    return {
      url: `${base}/${dir}/state_fips=${countyGeoid!.slice(0, 2)}/county_fips=${countyGeoid!.slice(2, 5)}/data.parquet`,
      byteLength,
    }
  }
  const name = (
    { nation: 'nation', state: 'states', county: 'counties' } as const
  )[level]
  return { url: `${base}/${name}.parquet`, byteLength: m[name] }
}

// Range requests only: the manifest gives each file's size, so no HEAD.
const rangeSource = (url: string, byteLength: number): AsyncBuffer => ({
  byteLength,
  async slice(start, end = byteLength) {
    const response = await fetch(url, {
      headers: { Range: `bytes=${start}-${end - 1}` },
    })
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    return response.arrayBuffer()
  },
})

// Caches hold the most recently used entries; a session browsing many
// counties keeps a few files and outlines, not all of them.
const FILE_LIMIT = 24
const GEOMETRY_LIMIT = 32

const keep = <K, V>(map: Map<K, V>, key: K, value: V, limit: number) => {
  map.delete(key)
  map.set(key, value)
  if (map.size > limit) map.delete(map.keys().next().value as K)
}

// Opened files, by URL.
const files = new Map<string, Promise<RegionFile>>()

const openFile = ({ url, byteLength }: { url: string; byteLength: number }) => {
  let file = files.get(url)
  if (!file) {
    file = openRegionFile(rangeSource(url, byteLength))
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
  const known = geometries.get(geometryKey(level, geoid))
  if (known || level !== 'nation') return known ?? null
  const file = await openFile(fileFor(await getManifest(), 'nation')!)
  const [row] = await readRows(file, 0, 1, ['geometry'])
  const geometry = (row?.geometry as RegionGeometry) ?? null
  if (geometry)
    keep(geometries, geometryKey(level, geoid), geometry, GEOMETRY_LIMIT)
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

const toGeography = (row: RegionRow, extent: number[]): Geography => {
  const stats = JSON.parse(String(row.stats)) as Stats
  const geography: Geography = {
    [GEOGRAPHY_ATTRIBUTE_KEYS.building_count]: stats.building_count,
    [GEOGRAPHY_ATTRIBUTE_KEYS.rps_2011_median]: stats.rps_2011_median,
    [GEOGRAPHY_ATTRIBUTE_KEYS.rps_2047_median]: stats.rps_2047_median,
    [GEOGRAPHY_ATTRIBUTE_KEYS.risk_score_2011_hist]: JSON.stringify(
      stats.risk_score_2011_hist,
    ),
    [GEOGRAPHY_ATTRIBUTE_KEYS.risk_score_2047_hist]: JSON.stringify(
      stats.risk_score_2047_hist,
    ),
    [GEOGRAPHY_ATTRIBUTE_KEYS.geoid]: stats.GEOID,
    [GEOGRAPHY_ATTRIBUTE_KEYS.bbox]: JSON.stringify(extent),
  }
  if (stats.NAME !== undefined && stats.NAME !== null) {
    geography[GEOGRAPHY_ATTRIBUTE_KEYS.name] = stats.NAME
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
  m: Manifest,
  x: number,
  y: number,
  countyGeoid?: string,
): Promise<Geography | null> => {
  const target = fileFor(m, level, countyGeoid)
  if (!target) return null
  const cached = last.get(target.url)
  if (cached && containsPoint(cached.geometry, x, y)) return cached.geography
  const row = await findRegion(await openFile(target), x, y, COLUMNS)
  return row ? remember(level, target.url, row) : null
}

const geoidOf = (row: RegionRow) =>
  (JSON.parse(String(row.stats)) as Stats).GEOID

const lookupById = async (
  level: GeographyKey,
  m: Manifest,
  geoid: string,
): Promise<Geography | null> => {
  const target = fileFor(m, level, geoid.slice(0, 5))
  if (!target) return null
  const cached = last.get(target.url)
  if (cached?.geography[GEOGRAPHY_ATTRIBUTE_KEYS.geoid] === geoid)
    return cached.geography
  const row = await findRegionById(
    await openFile(target),
    geoid,
    COLUMNS,
    geoidOf,
  )
  return row ? remember(level, target.url, row) : null
}

// The nation file holds one row, shown at every zoom.
let nation: Promise<Geography | null> | null = null

const readNation = async (m: Manifest) => {
  const file = await openFile(fileFor(m, 'nation')!)
  const [row] = await readRows(file, 0, 1, [...COLUMNS, 'bbox'])
  if (!row) return null
  const bbox = row.bbox as Record<'xmin' | 'ymin' | 'xmax' | 'ymax', number>
  return toGeography(row, [bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax])
}

const nationOf = (m: Manifest) => {
  if (!nation) {
    nation = readNation(m)
    nation.catch(() => (nation = null))
  }
  return nation
}

/** Fetch the manifest and the nation row now, before the first lookup. */
export const prefetchRegions = () => {
  getManifest()
    .then(nationOf)
    .catch(() => undefined)
}

// GEOID characters that name each level within a 15-digit block GEOID
const GEOID_LENGTH: Record<Exclude<GeographyKey, 'nation'>, number> = {
  state: 2,
  county: 5,
  censusTract: 11,
  censusBlock: 15,
}

/** The regions a building belongs to, from its block GEOID: exact, and with
 * every level looked up at once. */
export const lookupGeographiesById = async (
  blockGeoid: string,
  zoom: number,
): Promise<ActiveGeographies> => {
  const m = await getManifest()
  const at = (level: Exclude<GeographyKey, 'nation'>) =>
    zoom >= GEOGRAPHY_MIN_ZOOM[level]
      ? lookupById(level, m, blockGeoid.slice(0, GEOID_LENGTH[level]))
      : null
  const [nationGeography, state, county, censusTract, censusBlock] =
    await Promise.all([
      nationOf(m),
      at('state'),
      at('county'),
      at('censusTract'),
      at('censusBlock'),
    ])
  return { nation: nationGeography, state, county, censusTract, censusBlock }
}

export const lookupGeographies = async (
  lng: number,
  lat: number,
  zoom: number,
): Promise<ActiveGeographies> => {
  const m = await getManifest()
  const at = (level: GeographyKey) => zoom >= GEOGRAPHY_MIN_ZOOM[level]
  const [nationGeography, state, county] = await Promise.all([
    nationOf(m),
    at('state') ? lookup('state', m, lng, lat) : null,
    at('county') ? lookup('county', m, lng, lat) : null,
  ])
  const countyGeoid = county?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]
  const [censusTract, censusBlock] = await Promise.all([
    at('censusTract') && countyGeoid
      ? lookup('censusTract', m, lng, lat, countyGeoid)
      : null,
    at('censusBlock') && countyGeoid
      ? lookup('censusBlock', m, lng, lat, countyGeoid)
      : null,
  ])
  return { nation: nationGeography, state, county, censusTract, censusBlock }
}
