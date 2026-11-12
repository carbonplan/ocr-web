import { batchToGeoJSON, readFeatures } from 'tiled-geoparquet'
import { booleanPointInPolygon, point } from '@turf/turf'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { HISTORIC_URLS } from '@/lib/config'
import { openGeoParquet } from '@/lib/geoparquet'

// Point-in-polygon against the MTBS perimeters (ocr-multi-hazard:
// ocr.historic.mtbs), reading only the full-resolution rows whose bounding box
// covers the point.

export type FireAtPoint = {
  // file row index, which is also the perimeter's map feature id
  id: string
  eventId: string
  name: string
  type: string
  year: number
  date: string
  acres: number
}

const COLUMNS = [
  'event_id',
  'incid_name',
  'incid_type',
  'ig_date',
  'year',
  'burnbndac',
]
// ~10 m, so the rows read are the ones whose bbox covers the point
const PAD_DEGREES = 1e-4

// perimeters containing the point, most recent first
export const queryFiresAtPoint = async (
  [lng, lat]: [number, number],
  signal?: AbortSignal,
): Promise<FireAtPoint[]> => {
  const batch = await readFeatures(
    await openGeoParquet(HISTORIC_URLS.firePerimeters),
    {
      bbox: [
        lng - PAD_DEGREES,
        lat - PAD_DEGREES,
        lng + PAD_DEGREES,
        lat + PAD_DEGREES,
      ],
      resolution: 1e-6,
      columns: COLUMNS,
      geometry: 'primary',
      signal,
    },
  )
  const pt = point([lng, lat])
  const { features } = batchToGeoJSON(batch) as FeatureCollection
  return features
    .filter(
      (feature): feature is Feature<Polygon | MultiPolygon> =>
        (feature.geometry?.type === 'Polygon' ||
          feature.geometry?.type === 'MultiPolygon') &&
        booleanPointInPolygon(pt, feature as Feature<Polygon | MultiPolygon>),
    )
    .map((feature) => {
      const props = feature.properties as Record<string, unknown>
      return {
        id: String(feature.id),
        eventId: String(props.event_id),
        name: String(props.incid_name ?? ''),
        type: String(props.incid_type ?? ''),
        year: Number(props.year),
        date: String(props.ig_date ?? ''),
        acres: Number(props.burnbndac),
      }
    })
    .sort((a, b) => b.year - a.year)
}
