import { Address } from '@/types/location'

export const formatAddress = (address: Address) => {
  const parts = []
  if (address.houseNumber) parts.push(address.houseNumber)
  if (address.street) parts.push(address.street)
  const cityState = []
  if (address.city) cityState.push(address.city)
  if (address.state) cityState.push(address.state)
  if (cityState.length > 0) parts.push(cityState.join(', '))
  return parts.join(' ')
}
