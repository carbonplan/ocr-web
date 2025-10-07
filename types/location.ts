import { MapGeoJSONFeature } from 'maplibre-gl'
import { BUILDING_ATTRIBUTE_KEYS, GEOGRAPHY_ATTRIBUTE_KEYS } from '@/lib/config'

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

export type BuildingProperties = {
  [BUILDING_ATTRIBUTE_KEYS.wind_risk_2011]: number
  [BUILDING_ATTRIBUTE_KEYS.wind_risk_2047]: number
  [BUILDING_ATTRIBUTE_KEYS.burn_probability_2011]: number
  [BUILDING_ATTRIBUTE_KEYS.burn_probability_2047]: number
  [BUILDING_ATTRIBUTE_KEYS.conditional_risk_usfs]: number
  [BUILDING_ATTRIBUTE_KEYS.burn_probability_usfs_2011]: number
  [BUILDING_ATTRIBUTE_KEYS.burn_probability_usfs_2047]: number
}

export type Building = Omit<MapGeoJSONFeature, 'properties'> & {
  properties: BuildingProperties
}

export type Geography = {
  [GEOGRAPHY_ATTRIBUTE_KEYS.building_count]: number
  [GEOGRAPHY_ATTRIBUTE_KEYS.mean_wind_risk_2011]: number
  [GEOGRAPHY_ATTRIBUTE_KEYS.mean_wind_risk_2047]: number
  [GEOGRAPHY_ATTRIBUTE_KEYS.median_wind_risk_2011]: number
  [GEOGRAPHY_ATTRIBUTE_KEYS.median_wind_risk_2047]: number
  [GEOGRAPHY_ATTRIBUTE_KEYS.wind_risk_2011]: string // stringified number[]
  [GEOGRAPHY_ATTRIBUTE_KEYS.wind_risk_2047]: string // stringified number[]
  [GEOGRAPHY_ATTRIBUTE_KEYS.geoid]: string
  [GEOGRAPHY_ATTRIBUTE_KEYS.county_name]: string
}

export type Suggestion = {
  title: string
  id: string
  address: Address
}
