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

export function updateMapViewUrl(params: MapViewParams): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (url.searchParams.has('selected')) return

  url.searchParams.set('lat', params.lat.toFixed(5))
  url.searchParams.set('lng', params.lng.toFixed(5))
  url.searchParams.set('zoom', params.zoom.toFixed(2))
  window.history.replaceState(
    null,
    '',
    `${url.pathname}?${url.searchParams.toString()}`,
  )
}

export type SelectionCoordinates = {
  lat: number
  lng: number
}

export function getSelectionCoordinatesFromQuery(
  query: NextRouter['query'],
): SelectionCoordinates | null {
  const { selected } = query

  if (!selected || typeof selected !== 'string') return null

  const parts = selected.split(',')
  if (parts.length !== 2) return null

  const parsedLat = parseFloat(parts[0])
  const parsedLng = parseFloat(parts[1])

  if (
    isNaN(parsedLat) ||
    isNaN(parsedLng) ||
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLng < -180 ||
    parsedLng > 180
  ) {
    return null
  }

  return {
    lat: parsedLat,
    lng: parsedLng,
  }
}

export function updateSelectedBuildingUrl(params: SelectionCoordinates): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('lat')
  url.searchParams.delete('lng')
  url.searchParams.delete('zoom')
  url.searchParams.set(
    'selected',
    `${params.lat.toFixed(6)},${params.lng.toFixed(6)}`,
  )
  window.history.replaceState(
    null,
    '',
    `${url.pathname}?${url.searchParams.toString()}`,
  )
}

export function clearSelectedBuildingUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('selected')
  window.history.replaceState(
    null,
    '',
    `${url.pathname}?${url.searchParams.toString()}`,
  )
}
