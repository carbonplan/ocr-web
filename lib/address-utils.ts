import { Address } from '@/types/location'

type Options = {
  abbreviate?: boolean
  requireStreet?: boolean
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
