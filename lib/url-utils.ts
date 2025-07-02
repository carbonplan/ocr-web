import { NextRouter } from 'next/router'

export type MapViewParams = {
  lat: number
  lng: number
  zoom: number
}

export function getMapViewFromQuery(
  query: NextRouter['query'],
): MapViewParams | null {
  const { lat, lng, zoom } = query

  if (!lat || !lng || !zoom) return null

  const parsedLat = parseFloat(String(lat))
  const parsedLng = parseFloat(String(lng))
  const parsedZoom = parseFloat(String(zoom))

  if (
    isNaN(parsedLat) ||
    isNaN(parsedLng) ||
    isNaN(parsedZoom) ||
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLng < -180 ||
    parsedLng > 180 ||
    parsedZoom < 0 ||
    parsedZoom > 22
  ) {
    return null
  }

  return {
    lat: parsedLat,
    lng: parsedLng,
    zoom: parsedZoom,
  }
}

export function updateMapViewUrl(
  router: NextRouter,
  params: MapViewParams,
): void {
  const query = {
    ...router.query,
    lat: params.lat.toFixed(5),
    lng: params.lng.toFixed(5),
    zoom: params.zoom.toFixed(2),
  }

  router.replace(
    {
      pathname: router.pathname,
      query,
    },
    undefined,
    { shallow: true },
  )
}
