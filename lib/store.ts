import { create } from 'zustand'
import { Map } from 'maplibre-gl'
import type { ChazPointData } from './chaz-query'
import type { StormAtPoint } from './historic-events/storm-tracks'
import type { FireAtPoint } from './historic-events/fire-perimeters'
import type { FloodEvent, FloodSource } from './historic-events/flood-history'
import {
  Location,
  Building,
  BuildingProperties,
  Coordinates,
  Geography,
  GeographyKey,
} from '../types/location'
import { LAYERS } from './config'
import { lookupGeographies, lookupGeographiesById } from './region-lookup'
import {
  DEFAULT_HAZARD,
  RISKS,
  RISK_LAYER_ID,
  getMapLayer,
  HazardId,
  HazardConfig,
  FutureWindow,
  SelectorDimension,
} from './hazards'
import {
  clearSelectedBuildingUrl,
  updateHazardUrl,
  updateMapViewUrl,
} from './url-utils'

const DEFAULT_SELECTOR_VALUES = Object.fromEntries(
  Object.values(RISKS).flatMap((config: HazardConfig) =>
    (config.mapLayers ?? []).flatMap((layer) =>
      layer.selector ? [[layer.selector.dim, layer.selector.defaultValue]] : [],
    ),
  ),
) as Record<SelectorDimension, number>

export type BuildingQueryState =
  | { status: 'idle' | 'loading' | 'error' }
  | {
      status: 'success'
      value: number
      detail?: ChazPointData
      // a point's store values, by building column, in store units
      values?: BuildingProperties
    }

// Region lookups resolve out of order; only the latest one is applied.
let geographyQuery = 0
// The last region query, run again when the panel level or the hazard changes.
let lastGeographyQuery:
  | { kind: 'point'; lng: number; lat: number }
  | { kind: 'id'; geoid: string }
  | null = null

const NO_GEOGRAPHIES = {
  county: null,
  censusTract: null,
  censusBlock: null,
  state: null,
  nation: null,
}

const repeatGeographyQuery = (get: () => Store) => {
  const last = lastGeographyQuery
  if (last?.kind === 'point') get().queryGeographiesAtPoint(last.lng, last.lat)
  if (last?.kind === 'id') get().queryGeographiesById(last.geoid)
}

export type HistoricEventsState =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'success'; kind: 'storms'; events: StormAtPoint[] }
  | {
      status: 'success'
      kind: 'fires'
      events: FireAtPoint[]
    }
  | { status: 'success'; kind: 'floods'; events: FloodEvent[] }

const syncHazardUrl = (get: () => Store) => {
  const { hazard, futureWindow, mapLayer } = get()
  updateHazardUrl(hazard, futureWindow, mapLayer)
}

type Store = {
  map: Map | null
  setMap: (map: Map | null) => void
  selectedLocation: Location | null
  setSelectedLocation: (location: Location | null) => void
  satellite: boolean
  setSatellite: (satellite: boolean) => void
  selectedBuilding: Building | null
  setSelectedBuilding: (building: Building) => void
  // a clicked map point standing in for a building; mutually exclusive with
  // selectedBuilding
  selectedArea: Coordinates | null
  setSelectedArea: (area: Coordinates | null) => void
  activeGeographies: {
    county: Geography | null
    censusTract: Geography | null
    censusBlock: Geography | null
    state: Geography | null
    nation: Geography | null
  }
  setActiveGeographies: (activeGeographies: {
    county: Geography | null
    censusTract: Geography | null
    censusBlock: Geography | null
    state: Geography | null
    nation: Geography | null
  }) => void
  selectedGeographyLevel: GeographyKey
  setSelectedGeographyLevel: (level: GeographyKey) => void
  hasManuallySelectedGeography: boolean
  setHasManuallySelectedGeography: (value: boolean) => void
  showGeographyHighlight: boolean
  setShowGeographyHighlight: (show: boolean) => void
  timePeriod: 'current' | 'future'
  setTimePeriod: (timePeriod: 'current' | 'future') => void
  hazard: HazardId
  setHazard: (hazard: HazardId) => void
  futureWindow: FutureWindow
  setFutureWindow: (futureWindow: FutureWindow) => void
  // RISK_LAYER_ID for the risk view, or a HazardMapLayer id
  mapLayer: string
  setMapLayer: (mapLayer: string) => void
  selectorValues: Record<SelectorDimension, number>
  setSelectorValues: (
    update: Partial<Record<SelectorDimension, number>>,
  ) => void
  buildingQuery: BuildingQueryState
  setBuildingQuery: (buildingQuery: BuildingQueryState) => void
  // historic storms or fires at the selected point, per the active hazard
  historicEvents: HistoricEventsState
  setHistoricEvents: (historicEvents: HistoricEventsState) => void
  // SID, MTBS event id, or flood event id hovered in the sidebar list
  hoveredEventId: string | null
  setHoveredEventId: (id: string | null) => void
  // which flood record source the previous floods map draws
  floodSource: FloodSource
  setFloodSource: (floodSource: FloodSource) => void
  // storm whose modeled wind field is drawn
  selectedStormId: string | null
  setSelectedStormId: (id: string | null) => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  riskConfig: HazardConfig
  colorLimits: {
    bounds: [number, number]
    binBoundaries: number[]
  }
  setColorLimits: (colorLimits: {
    bounds: [number, number]
    binBoundaries: number[]
  }) => void
  mapLoading: boolean
  setMapLoading: (mapLoading: boolean) => void
  zarrLoading: boolean
  setZarrLoading: (zarrLoading: boolean) => void
  reverseGeocodeLoading: boolean
  setReverseGeocodeLoading: (reverseGeocodeLoading: boolean) => void
  advancedMode: boolean
  toggleAdvancedMode: () => void
  queryGeographiesAtPoint: (lng: number, lat: number) => void
  queryGeographiesById: (blockGeoid: string) => void
  cancelGeographyQueries: () => void
  // a region lookup is under way; the panel shows a spinner rather than "no data"
  geographiesLoading: boolean
  setGeographiesLoading: (loading: boolean) => void
  clearSelections: () => void
}

export const useStore = create<Store>((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  satellite: false,
  setSatellite: (satellite) => set({ satellite }),
  selectedBuilding: null,
  setSelectedBuilding: (building) =>
    set({ selectedBuilding: building, selectedArea: null }),
  selectedArea: null,
  setSelectedArea: (area) =>
    set({ selectedArea: area, selectedBuilding: null }),
  activeGeographies: {
    county: null,
    censusTract: null,
    censusBlock: null,
    state: null,
    nation: null,
  },
  setActiveGeographies: ({ county, censusTract, censusBlock, state, nation }) =>
    set({
      activeGeographies: { county, censusTract, censusBlock, state, nation },
    }),
  selectedGeographyLevel: 'nation',
  setSelectedGeographyLevel: (level) => {
    if (get().selectedGeographyLevel === level) return
    set({ selectedGeographyLevel: level })
    // lookups read only the level shown, so a new level is looked up again
    repeatGeographyQuery(get)
  },
  hasManuallySelectedGeography: false,
  setHasManuallySelectedGeography: (value) =>
    set({ hasManuallySelectedGeography: value }),
  showGeographyHighlight: false,
  setShowGeographyHighlight: (show) => set({ showGeographyHighlight: show }),
  timePeriod: 'current',
  setTimePeriod: (timePeriod) => set({ timePeriod }),
  hazard: DEFAULT_HAZARD,
  setHazard: (hazard) => {
    if (hazard === get().hazard) return
    const config = RISKS[hazard]
    set({
      hazard,
      timePeriod: config.datasets[get().timePeriod]
        ? get().timePeriod
        : 'current', // fallback to current if future unavailable
      riskConfig: config,
      mapLayer: RISK_LAYER_ID,
      colorLimits: {
        bounds: [
          config.binBoundaries[0],
          config.binBoundaries[config.binBoundaries.length - 1],
        ],
        binBoundaries: [...config.binBoundaries],
      },
      buildingQuery: { status: 'idle' },
      historicEvents: { status: 'idle' },
      hoveredEventId: null,
      selectedStormId: null,
    })
    syncHazardUrl(get)
    // each hazard summarizes its own region files
    repeatGeographyQuery(get)
  },
  futureWindow: 'fut1',
  setFutureWindow: (futureWindow) => {
    set({ futureWindow })
    syncHazardUrl(get)
  },
  mapLayer: RISK_LAYER_ID,
  selectorValues: DEFAULT_SELECTOR_VALUES,
  setSelectorValues: (values) =>
    set({ selectorValues: { ...get().selectorValues, ...values } }),
  setMapLayer: (mapLayer) => {
    if (mapLayer === get().mapLayer) return
    const config = get().riskConfig
    const layer = getMapLayer(config, mapLayer)
    const bins = layer ? layer.binBoundaries : config.binBoundaries
    set({
      mapLayer,
      colorLimits: {
        bounds: [bins[0], bins[bins.length - 1]],
        binBoundaries: [...bins],
      },
    })
    syncHazardUrl(get)
  },
  buildingQuery: { status: 'idle' },
  setBuildingQuery: (buildingQuery) => set({ buildingQuery }),
  historicEvents: { status: 'idle' },
  setHistoricEvents: (historicEvents) => set({ historicEvents }),
  hoveredEventId: null,
  setHoveredEventId: (hoveredEventId) => set({ hoveredEventId }),
  floodSource: 'satellite',
  setFloodSource: (floodSource) => set({ floodSource }),
  selectedStormId: null,
  setSelectedStormId: (selectedStormId) => set({ selectedStormId }),
  sidebarWidth: 0,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  riskConfig: RISKS[DEFAULT_HAZARD],
  colorLimits: {
    bounds: [
      RISKS[DEFAULT_HAZARD].binBoundaries[0],
      RISKS[DEFAULT_HAZARD].binBoundaries[
        RISKS[DEFAULT_HAZARD].binBoundaries.length - 1
      ],
    ],
    binBoundaries: [...RISKS[DEFAULT_HAZARD].binBoundaries],
  },
  setColorLimits: (colorLimits) => set({ colorLimits: colorLimits }),
  mapLoading: false,
  setMapLoading: (mapLoading) => set({ mapLoading }),
  zarrLoading: false,
  setZarrLoading: (zarrLoading) => set({ zarrLoading }),
  reverseGeocodeLoading: false,
  setReverseGeocodeLoading: (reverseGeocodeLoading) =>
    set({ reverseGeocodeLoading }),
  advancedMode: process.env.NEXT_PUBLIC_ADVANCED_MODE === 'true',
  toggleAdvancedMode: () =>
    set((state) => ({ advancedMode: !state.advancedMode })),
  queryGeographiesAtPoint: async (lng: number, lat: number) => {
    const { map, riskConfig, selectedGeographyLevel } = get()
    if (!map) return
    const query = ++geographyQuery
    lastGeographyQuery = { kind: 'point', lng, lat }
    set({ geographiesLoading: true })
    try {
      const activeGeographies = await lookupGeographies(
        riskConfig,
        lng,
        lat,
        map.getZoom(),
        selectedGeographyLevel,
      )
      if (query === geographyQuery)
        set({ activeGeographies, geographiesLoading: false })
    } catch (error) {
      console.error('Region lookup failed:', error)
      // show no regions rather than the last location's
      if (query === geographyQuery)
        set({ activeGeographies: NO_GEOGRAPHIES, geographiesLoading: false })
    }
  },
  queryGeographiesById: async (blockGeoid: string) => {
    const { map, riskConfig, selectedGeographyLevel } = get()
    if (!map) return
    const query = ++geographyQuery
    lastGeographyQuery = { kind: 'id', geoid: blockGeoid }
    set({ geographiesLoading: true })
    try {
      const activeGeographies = await lookupGeographiesById(
        riskConfig,
        blockGeoid,
        map.getZoom(),
        selectedGeographyLevel,
      )
      if (query === geographyQuery)
        set({ activeGeographies, geographiesLoading: false })
    } catch (error) {
      console.error('Region lookup failed:', error)
      if (query === geographyQuery)
        set({ activeGeographies: NO_GEOGRAPHIES, geographiesLoading: false })
    }
  },
  // as when another building is selected: lookups in flight no longer apply,
  // and the regions shown belong to the last selection, so they are cleared
  cancelGeographyQueries: () => {
    geographyQuery++
    // the selection's own lookup follows; a level change meanwhile has nothing to repeat
    lastGeographyQuery = null
    set({ activeGeographies: NO_GEOGRAPHIES, geographiesLoading: true })
  },
  geographiesLoading: false,
  setGeographiesLoading: (geographiesLoading) => set({ geographiesLoading }),
  clearSelections: () => {
    set({
      selectedLocation: null,
      selectedBuilding: null,
      selectedArea: null,
      buildingQuery: { status: 'idle' },
      historicEvents: { status: 'idle' },
      hoveredEventId: null,
      selectedStormId: null,
      activeGeographies: {
        county: null,
        censusTract: null,
        censusBlock: null,
        state: null,
        nation: null,
      },
      showGeographyHighlight: false,
    })
    clearSelectedBuildingUrl()
    const { map, queryGeographiesAtPoint } = get()
    if (map) {
      map.removeFeatureState({
        source: LAYERS.buildings.sourceId,
        sourceLayer: LAYERS.buildings.layerName,
      })
      const center = map.getCenter()
      const zoom = map.getZoom()
      updateMapViewUrl({
        lat: center.lat,
        lng: center.lng,
        zoom: zoom,
      })
      queryGeographiesAtPoint(center.lng, center.lat)
    }
  },
}))
