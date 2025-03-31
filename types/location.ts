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
  countryCode: string
  countryName: string
  stateCode: string
  state: string
  county: string
  city: string
  district: string
  street: string
  postalCode: string
  houseNumber: string
}

export type Location = {
  title: string
  id: string
  address: Address
  position: Coordinates
  access?: Coordinates[]
  mapView?: BoundingBox
}

export type Suggestion = {
  title: string
  id: string
  address: Address
}
