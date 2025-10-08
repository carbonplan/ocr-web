import type { NextApiRequest, NextApiResponse } from 'next'
import { PassThrough } from 'stream'
import { Readable } from 'stream'
import type { ReadableStream } from 'stream/web'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { params, style, size = 512 } = req.query
  const [z, x, y] = Array.isArray(params) ? params : []

  if (!z || !x || !y) {
    return res.status(400).json({ message: 'Missing required parameters' })
  }

  const apiKey = process.env.HERE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ message: 'HERE API key not configured' })
  }

  const format = style === 'dem' ? 'png' : 'png8'

  const url = `https://maps.hereapi.com/v3/base/mc/${z}/${x}/${y}/${format}?style=${style}&size=${size}&apiKey=${apiKey}`

  try {
    const response = await fetch(url)

    if (!response.ok || !response.body) {
      const errorText = await response.text()
      return res.status(response.status).json({
        message: `HERE API error: ${response.statusText}`,
        details: errorText,
      })
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    res.setHeader('Content-Type', contentType)

    res.setHeader('Cache-Control', 'public, max-age=86400')

    const passthrough = new PassThrough()
    const readable = Readable.fromWeb(
      response.body as ReadableStream<Uint8Array>,
    )
    readable.on('error', (err: Error) => {
      console.error('Stream error:', err)
      res.destroy(err)
    })
    readable.pipe(passthrough)
    passthrough.pipe(res)
  } catch (error) {
    console.error('Tile fetch error:', error)
    res.status(500).json({
      message: 'Error fetching map tile',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
