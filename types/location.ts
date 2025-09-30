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
export type RiskScoreSet<T> = Record<ScenarioKey, T>

export type MethodKey = 'baseRisk' | 'windRisk'
export type FireRisk<T> = Record<MethodKey, RiskScoreSet<T>>

export type Building = FireRisk<number>

export type Geography = {
  name: string
  buildingCount: number
  risk: FireRisk<{ average: number; data: number[] }>
}

export type Suggestion = {
  title: string
  id: string
  address: Address
}
