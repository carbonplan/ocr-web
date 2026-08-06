import { Address } from '@/types/location'

type Options = {
  abbreviate?: boolean
  requireStreet?: boolean
}
// regional label for an area selection: the containing city (or county, or
// state), never a street address, since the value covers a wide grid cell
export const formatRegionName = (address: Address) => {
  const parts = []
  if (address.city) {
    parts.push(address.city)
  } else if (address.county) {
    parts.push(address.county)
  } else if (address.state) {
    parts.push(address.state)
  }
  if (address.stateCode && parts[0] !== address.state) {
    parts.push(address.stateCode)
  }
  return parts.join(', ')
}

export const formatAddress = (address: Address, options: Options = {}) => {
  const shortFormElements = []
  if (address.houseNumber) shortFormElements.push(address.houseNumber)
  if (address.street) shortFormElements.push(address.street)

  const base = shortFormElements.join(' ')
  if (options.abbreviate) {
    return base
  }

  const cityState = []
  if (address.city) cityState.push(address.city)
  if (address.stateCode) cityState.push(address.stateCode)
  if (cityState.length === 0) {
    return base
  } else if (!base && options.requireStreet) {
    return ''
  } else if (!base) {
    return cityState.join(', ')
  } else {
    return [base, ...cityState].join(', ')
  }
}
