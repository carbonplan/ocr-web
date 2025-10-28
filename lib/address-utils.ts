import { Address } from '@/types/location'

export const formatAddress = (address: Address, shortForm?: boolean) => {
  const shortFormElements = []
  if (address.houseNumber) shortFormElements.push(address.houseNumber)
  if (address.street) shortFormElements.push(address.street)

  const base = shortFormElements.join(' ')
  if (shortForm) {
    return base
  }

  const cityState = []
  if (address.city) cityState.push(address.city)
  if (address.state) cityState.push(address.state)
  if (cityState.length === 0) {
    return base
  } else if (!base) {
    return cityState.join(', ')
  } else {
    return [base, ...cityState].join(', ')
  }
}
