import { coalescing, httpSource, openReader } from 'tiled-geoparquet'

type Reader = Awaited<ReturnType<typeof openReader>>

const readers = new Map<string, Promise<Reader>>()

// One main-thread reader per GeoParquet file, so its footer and spatial index
// are read once however many lookups use it; a failed open is retried.
export const openGeoParquet = (url: string): Promise<Reader> => {
  let reader = readers.get(url)
  if (!reader) {
    reader = httpSource([url]).then((source) => openReader(coalescing(source)))
    reader.catch(() => readers.delete(url))
    readers.set(url, reader)
  }
  return reader
}
