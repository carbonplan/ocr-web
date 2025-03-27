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
  language: string
  resultType: string
  houseNumberType: string
  address: Address
  position: {
    lat: number
    lng: number
  }
  access: Array<{
    lat: number
    lng: number
  }>
  mapView: {
    west: number
    south: number
    east: number
    north: number
  }
}

export type Suggestion = {
  title: string
  id: string
  language: string
  resultType: string
  houseNumberType: string
  address: Address
  highlights: {
    title: Array<{ start: number; end: number }>
    address: {
      label: Array<{ start: number; end: number }>
      street: Array<{ start: number; end: number }>
      houseNumber: Array<{ start: number; end: number }>
    }
  }
}
