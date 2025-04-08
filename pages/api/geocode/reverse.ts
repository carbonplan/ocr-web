import type { NextApiRequest, NextApiResponse } from 'next'
import { Location } from '../../../types/location'

type HereApiResponse = {
  items: Array<{
    title: string
    id: string
    address: {
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
  }>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Location | { message: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { lat, lng } = req.query

  if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
    return res
      .status(400)
      .json({ message: 'Latitude and longitude parameters are required' })
  }

  try {
    const response = await fetch(
      `https://revgeocode.search.hereapi.com/v1/revgeocode?apiKey=${process.env.HERE_API_KEY}&at=${lat},${lng}&lang=en`,
    )
    const data: HereApiResponse = await response.json()

    if (data.items.length === 0) {
      return res.status(404).json({ message: 'No location found' })
    }

    const item = data.items[0]
    const location: Location = {
      title: item.title,
      id: item.id,
      address: item.address,
      position: item.position,
      access: item.access,
      mapView: item.mapView,
    }

    res.status(200).json(location)
  } catch (error) {
    console.error('Reverse geocode error:', error)
    res.status(500).json({ message: 'Error fetching location details' })
  }
}
