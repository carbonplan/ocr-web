import type { NextApiRequest, NextApiResponse } from 'next'
import { Suggestion } from '../../../types/location'

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
    highlights?: {
      title?: Array<{ start: number; end: number }>
      address?: {
        label?: Array<{ start: number; end: number }>
        street?: Array<{ start: number; end: number }>
        houseNumber?: Array<{ start: number; end: number }>
      }
    }
  }>
}

type ApiResponse = {
  items: Suggestion[]
}

type ErrorResponse = {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | ErrorResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { q } = req.query

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ message: 'Query parameter is required' })
  }

  if (q.trim().length < 3) {
    return res.status(200).json({ items: [] })
  }

  const bbox = [-127, 23, -65, 50].join(',')
  const countryCode = 'USA'
  const limit = 5
  const controller = new AbortController()

  const abortUpstreamRequest = () => {
    controller.abort()
  }

  req.on('close', abortUpstreamRequest)

  try {
    const response = await fetch(
      `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(q)}&in=countryCode:${countryCode}&in=bbox:${bbox}&limit=${limit}&apiKey=${process.env.HERE_API_KEY}`,
      { signal: controller.signal },
    )
    const data: HereApiResponse = await response.json()

    const suggestions: Suggestion[] = data.items.map((item) => ({
      title: item.title,
      id: item.id,
      address: item.address,
    }))

    res.status(200).json({ items: suggestions })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      if (!res.writableEnded) res.end()
      return
    }
    console.error('Autocomplete error:', error)
    res.status(500).json({ message: 'Error fetching autocomplete results' })
  } finally {
    req.off('close', abortUpstreamRequest)
  }
}
