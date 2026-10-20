import { PMTiles } from 'pmtiles'
import { distance } from '@turf/turf'
import { HISTORIC_URLS, LAYERS } from '@/lib/config'
import { readFeaturesAround } from './vector-tiles'

// Groundsource news records whose geocoded place is small and close. Larger
// footprints are whole towns or cities, which say nothing about a building.

export const NEWS_NEAR_KM = 0.5
export const NEWS_MAX_KM2 = 1

export type NewsFlood = {
  id: string
  startDate: string
  endDate: string
  year: number
  areaKm2: number
  distanceKm: number
}

let archive: PMTiles | null = null

const getArchive = () => {
  if (!archive) archive = new PMTiles(HISTORIC_URLS.floodNews)
  return archive
}

export const queryNewsFloodsNearPoint = async (
  [lng, lat]: [number, number],
  signal?: AbortSignal,
): Promise<NewsFlood[]> => {
  const features = await readFeaturesAround(
    getArchive(),
    LAYERS.floodNews.layerName,
    [lng, lat],
    NEWS_NEAR_KM,
    signal,
  )
  const floods = new Map<string, NewsFlood>()
  for (const feature of features) {
    const props = feature.properties
    if (feature.geometry.type !== 'Point') continue
    if (Number(props.area_km2) >= NEWS_MAX_KM2) continue
    const km = distance([lng, lat], feature.geometry.coordinates, {
      units: 'kilometers',
    })
    if (km > NEWS_NEAR_KM) continue
    const id = String(props.uuid)
    floods.set(id, {
      id,
      startDate: String(props.start_date ?? ''),
      endDate: String(props.end_date ?? ''),
      year: Number(props.year),
      areaKm2: Number(props.area_km2),
      distanceKm: km,
    })
  }
  return [...floods.values()]
}
