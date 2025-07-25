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

type TimeFrames<T> = {
  1: T
  15: T
  30: T
}

export type RiskScoreSet<T> = {
  current: TimeFrames<T>
  future: TimeFrames<T>
}

export type Building = {
  baseRisk: RiskScoreSet<number>
  windRisk: RiskScoreSet<number>
}

export type County = {
  [key: string]: string | number
} // TODO: flesh out types for county and building

export type Suggestion = {
  title: string
  id: string
  address: Address
}
