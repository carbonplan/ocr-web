import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { q } = req.query

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ message: 'Query parameter is required' })
  }

  try {
    const response = await fetch(
      `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(
        q,
      )}&in=countryCode:USA&limit=3&apiKey=${process.env.HERE_API_KEY}`,
    )
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Autocomplete error:', error)
    res.status(500).json({ message: 'Error fetching autocomplete results' })
  }
}
