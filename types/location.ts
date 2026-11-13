import { MapGeoJSONFeature } from 'maplibre-gl'

export type Coordinates = {
  lat: number
  lng: number
}

export type BoundingBox = {
  west: number
  south: number
  east: number
  north: number
}

export type Address = {
  label: string
  countryCode?: string
  countryName?: string
  stateCode?: string
  state?: string
  county?: string
  city?: string
  district?: string
  street?: string
  postalCode?: string
  houseNumber?: string
}

export type Location = {
  title: string
  id: string
  address: Address
  position: Coordinates
  access?: Coordinates[]
  mapView?: BoundingBox
}

export type ScenarioKey = 'current' | 'future'

export type GeographyKey =
  | 'county'
  | 'censusTract'
  | 'censusBlock'
  | 'state'
  | 'nation'

// tile properties, then the columns read by row on selection; a building
// with no value for a column lacks it
export type BuildingProperties = Record<string, number | null | undefined>

export type Building = Omit<MapGeoJSONFeature, 'properties'> & {
  id: number // row in `file`, not durable across data versions
  // the buildings file the selection was made in; ids from another file name other buildings
  file: string
  properties: BuildingProperties
}

// [west, south, east, north]
export type Extent = [number, number, number, number]

// A region's summary of each dataset variable, in the region file's units.
export type Geography = {
  geoid: string
  name?: string
  buildingCount: number
  median: Record<string, number | null>
  // building counts per risk score, from 0 up
  hist: Record<string, number[] | null>
  bbox: Extent
}

export type Suggestion = {
  title: string
  id: string
  address: Address
}
