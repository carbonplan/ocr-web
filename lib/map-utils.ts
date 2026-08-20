import { Map, MapSourceDataEvent } from 'maplibre-gl'

export const ensureSourceLoaded = (map: Map, sourceId: string) => {
  if (map.getSource(sourceId) && map.isSourceLoaded(sourceId))
    return Promise.resolve()
  return new Promise<void>((resolve) => {
    const handleSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceId === sourceId && e.isSourceLoaded) {
        map.off('sourcedata', handleSourceData)
        resolve()
      }
    }
    map.on('sourcedata', handleSourceData)
  })
}
