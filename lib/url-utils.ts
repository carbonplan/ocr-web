import { NextRouter } from 'next/router'
import {
  DEFAULT_HAZARD,
  RISKS,
  RISK_LAYER_ID,
  getMapLayer,
  HazardId,
  FutureWindow,
  isHazardId,
} from './hazards'

export type HazardParams = {
  hazard: HazardId
  futureWindow: FutureWindow | null
  mapLayer: string | null
  selectorValue: number | null
}

export function getHazardFromQuery(
  query: NextRouter['query'],
): HazardParams | null {
  const { hazard, window: futureWindow, layer, rp } = query
  if (!hazard || typeof hazard !== 'string' || !isHazardId(hazard)) return null

  const mapLayer =
    typeof layer === 'string' && getMapLayer(RISKS[hazard], layer)
      ? layer
      : null
  const selector = mapLayer
    ? getMapLayer(RISKS[hazard], mapLayer)?.selector
    : undefined
  const parsedRp = typeof rp === 'string' ? Number(rp) : NaN
  const selectorValue =
    selector && selector.values.includes(parsedRp) ? parsedRp : null

  return {
    hazard,
    futureWindow:
      futureWindow === 'fut1' || futureWindow === 'fut2' ? futureWindow : null,
    mapLayer,
    selectorValue,
  }
}

export function updateHazardUrl(
  hazard: HazardId,
  futureWindow: FutureWindow,
  mapLayer: string,
  selectorValue: number | null,
): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)

  if (hazard === DEFAULT_HAZARD) {
    url.searchParams.delete('hazard')
    url.searchParams.delete('window')
  } else {
    url.searchParams.set('hazard', hazard)
    if (futureWindow === 'fut1') {
      url.searchParams.delete('window')
    } else {
      url.searchParams.set('window', futureWindow)
    }
  }

  const layer = getMapLayer(RISKS[hazard], mapLayer)
  if (mapLayer === RISK_LAYER_ID || !layer) {
    url.searchParams.delete('layer')
    url.searchParams.delete('rp')
  } else {
    url.searchParams.set('layer', mapLayer)
    if (
      selectorValue === null ||
      selectorValue === layer.selector?.defaultValue
    ) {
      url.searchParams.delete('rp')
    } else {
      url.searchParams.set('rp', String(selectorValue))
    }
  }

  window.history.replaceState(
    null,
    '',
    `${url.pathname}?${url.searchParams.toString()}`,
  )
}

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
  if (url.searchParams.has('selected') || url.searchParams.has('area')) return

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

const parseCoordinateParam = (
  value: NextRouter['query'][string],
): SelectionCoordinates | null => {
  if (!value || typeof value !== 'string') return null

  const parts = value.split(',')
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

export function getSelectionCoordinatesFromQuery(
  query: NextRouter['query'],
): SelectionCoordinates | null {
  return parseCoordinateParam(query.selected)
}

export function getAreaCoordinatesFromQuery(
  query: NextRouter['query'],
): SelectionCoordinates | null {
  return parseCoordinateParam(query.area)
}

const updateSelectionParam = (
  param: 'selected' | 'area',
  params: SelectionCoordinates,
): void => {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('lat')
  url.searchParams.delete('lng')
  url.searchParams.delete('zoom')
  url.searchParams.delete(param === 'selected' ? 'area' : 'selected')
  url.searchParams.set(
    param,
    `${params.lat.toFixed(6)},${params.lng.toFixed(6)}`,
  )
  window.history.replaceState(
    null,
    '',
    `${url.pathname}?${url.searchParams.toString()}`,
  )
}

export function updateSelectedBuildingUrl(params: SelectionCoordinates): void {
  updateSelectionParam('selected', params)
}

export function updateSelectedAreaUrl(params: SelectionCoordinates): void {
  updateSelectionParam('area', params)
}

export function clearSelectedBuildingUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('selected')
  url.searchParams.delete('area')
  window.history.replaceState(
    null,
    '',
    `${url.pathname}?${url.searchParams.toString()}`,
  )
}
