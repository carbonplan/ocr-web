import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Lookup error:', error)
    res.status(500).json({ message: 'Error fetching location details' })
  }
}
