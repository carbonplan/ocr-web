import { asyncBufferFromUrl, parquetReadObjects } from 'hyparquet'
import {
  containsPoint,
  findRegion,
  openRegionFile,
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

const COLUMNS = [
  'GEOID',
  'building_count',
  'rps_2011_mean',
  'rps_2047_mean',
  'rps_2011_median',
  'rps_2047_median',
  'risk_score_2011_hist',
  'risk_score_2047_hist',
  'geometry',
]
const NAMED_COLUMNS = [...COLUMNS, 'NAME']

const fileUrl = (level: GeographyKey, countyGeoid?: string) => {
  const base = DATA_URLS.vector.regions
  if (level === 'censusTract' || level === 'censusBlock') {
    const dir = level === 'censusTract' ? 'tracts' : 'blocks'
    return `${base}/${dir}/state_fips=${countyGeoid!.slice(0, 2)}/county_fips=${countyGeoid!.slice(2, 5)}/data.parquet`
  }
  const name = { nation: 'nation', state: 'states', county: 'counties' }[level]
  return `${base}/${name}.parquet`
}

// Opened files, by URL. A county with no tracts or blocks has no file.
const files = new Map<string, Promise<RegionFile | null>>()

const openFile = (url: string) => {
  let file = files.get(url)
  if (!file) {
    file = asyncBufferFromUrl({ url })
      .then(openRegionFile)
      .catch(() => null)
    files.set(url, file)
  }
  return file
}

// Region geometries for the highlight, by level and GEOID.
const geometries = new Map<string, RegionGeometry>()
const geometryKey = (level: GeographyKey, geoid: string) => `${level}:${geoid}`

export const getRegionGeometry = (level: GeographyKey, geoid: string) =>
  geometries.get(geometryKey(level, geoid)) ?? null

const bounds = (geometry: RegionGeometry) => {
  let [xmin, ymin, xmax, ymax] = [Infinity, Infinity, -Infinity, -Infinity]
  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  for (const polygon of polygons) {
    for (const [x, y] of polygon[0]) {
      if (x < xmin) xmin = x
      if (y < ymin) ymin = y
      if (x > xmax) xmax = x
      if (y > ymax) ymax = y
    }
  }
  return [xmin, ymin, xmax, ymax]
}

const toGeography = (level: GeographyKey, row: RegionRow): Geography => {
  const geoid = String(row.GEOID)
  geometries.set(geometryKey(level, geoid), row.geometry)
  const geography: Geography = {
    [GEOGRAPHY_ATTRIBUTE_KEYS.building_count]: Number(row.building_count),
    [GEOGRAPHY_ATTRIBUTE_KEYS.mean_rps_2011]: Number(row.rps_2011_mean),
    [GEOGRAPHY_ATTRIBUTE_KEYS.mean_rps_2047]: Number(row.rps_2047_mean),
    [GEOGRAPHY_ATTRIBUTE_KEYS.rps_2011_median]: Number(row.rps_2011_median),
    [GEOGRAPHY_ATTRIBUTE_KEYS.rps_2047_median]: Number(row.rps_2047_median),
    [GEOGRAPHY_ATTRIBUTE_KEYS.risk_score_2011_hist]: JSON.stringify(
      row.risk_score_2011_hist,
    ),
    [GEOGRAPHY_ATTRIBUTE_KEYS.risk_score_2047_hist]: JSON.stringify(
      row.risk_score_2047_hist,
    ),
    [GEOGRAPHY_ATTRIBUTE_KEYS.geoid]: geoid,
    [GEOGRAPHY_ATTRIBUTE_KEYS.bbox]: JSON.stringify(bounds(row.geometry)),
  }
  if (row.NAME !== undefined && row.NAME !== null) {
    geography[GEOGRAPHY_ATTRIBUTE_KEYS.name] = String(row.NAME)
  }
  return geography
}

// The last match per level; a point still inside it needs no reads.
const last = new Map<
  string,
  { geography: Geography; geometry: RegionGeometry }
>()

const lookup = async (
  level: GeographyKey,
  url: string,
  x: number,
  y: number,
): Promise<Geography | null> => {
  const cached = last.get(url)
  if (cached && containsPoint(cached.geometry, x, y)) return cached.geography
  const file = await openFile(url)
  if (!file) return null
  const columns =
    level === 'state' || level === 'county' ? NAMED_COLUMNS : COLUMNS
  const row = await findRegion(file, x, y, columns)
  if (!row) return null
  const geography = toGeography(level, row)
  last.set(url, { geography, geometry: row.geometry })
  return geography
}

// The nation file holds one row, shown at every zoom.
const readNation = async () => {
  const file = await openFile(fileUrl('nation'))
  if (!file) return null
  const [row] = await parquetReadObjects({
    file: file.file,
    metadata: file.metadata,
    columns: NAMED_COLUMNS,
  })
  return row ? toGeography('nation', row as RegionRow) : null
}

let nation: Promise<Geography | null> | null = null

export const lookupGeographies = async (
  lng: number,
  lat: number,
  zoom: number,
): Promise<ActiveGeographies> => {
  nation ??= readNation().then((row) => {
    if (!row) nation = null
    return row
  })
  const at = (level: GeographyKey) => zoom >= GEOGRAPHY_MIN_ZOOM[level]
  const [nationGeography, state, county] = await Promise.all([
    nation,
    at('state') ? lookup('state', fileUrl('state'), lng, lat) : null,
    at('county') ? lookup('county', fileUrl('county'), lng, lat) : null,
  ])
  const countyGeoid = county?.[GEOGRAPHY_ATTRIBUTE_KEYS.geoid]
  const [censusTract, censusBlock] = countyGeoid
    ? await Promise.all([
        at('censusTract')
          ? lookup('censusTract', fileUrl('censusTract', countyGeoid), lng, lat)
          : null,
        at('censusBlock')
          ? lookup('censusBlock', fileUrl('censusBlock', countyGeoid), lng, lat)
          : null,
      ])
    : [null, null]
  return {
    nation: nationGeography,
    state,
    county,
    censusTract,
    censusBlock,
  }
}
