import type { NextApiRequest, NextApiResponse } from 'next'
import { Location } from '../../../types/location'

type HereApiResponse = {
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
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Location | { message: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'ID parameter is required' })
  }

  try {
    const response = await fetch(
      `https://lookup.search.hereapi.com/v1/lookup?apiKey=${process.env.HERE_API_KEY}&id=${id}`,
    )

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(
        `HERE lookup API error: ${response.status}`,
        body.slice(0, 200),
      )
      return res
        .status(502)
        .json({ message: 'Upstream geocoding service error' })
    }

    const data: HereApiResponse = await response.json()

    if (!data.title || !data.id || !data.address || !data.position) {
      console.error(
        'HERE lookup API returned malformed data:',
        JSON.stringify(data).slice(0, 200),
      )
      return res
        .status(502)
        .json({ message: 'Upstream geocoding service error' })
    }

    const location: Location = {
      title: data.title,
      id: data.id,
      address: data.address,
      position: data.position,
      access: data.access,
      mapView: data.mapView,
    }

    res.status(200).json(location)
  } catch (error) {
    console.error('Lookup error:', error)
    res.status(500).json({ message: 'Error fetching location details' })
  }
}
