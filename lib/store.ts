import { create } from 'zustand'
import { Map } from 'maplibre-gl'
import { Location, Building, Geography, GeographyKey } from '../types/location'
import { LAYERS, RISKS } from './config'
import { lookupGeographies, lookupGeographiesById } from './region-lookup'
import { clearSelectedBuildingUrl, updateMapViewUrl } from './url-utils'

type RiskConfig = (typeof RISKS)[keyof typeof RISKS]

type Store = {
  map: Map | null
  setMap: (map: Map | null) => void
  selectedLocation: Location | null
  setSelectedLocation: (location: Location | null) => void
  satellite: boolean
  setSatellite: (satellite: boolean) => void
  riskRaster: boolean
  setRiskRaster: (riskRaster: boolean) => void
  selectedBuilding: Building | null
  setSelectedBuilding: (building: Building) => void
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
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  riskConfig: RiskConfig
  setRiskConfig: (riskConfig: RiskConfig) => void
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
  clearSelections: () => void
}

// Region lookups resolve out of order; only the latest one is applied.
let geographyQuery = 0
// The last region query, run again when the panel changes level.
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

export const useStore = create<Store>((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  satellite: false,
  setSatellite: (satellite) => set({ satellite }),
  riskRaster: false,
  setRiskRaster: (riskRaster) => set({ riskRaster }),
  selectedBuilding: null,
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
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
    const last = lastGeographyQuery
    if (last?.kind === 'point')
      get().queryGeographiesAtPoint(last.lng, last.lat)
    if (last?.kind === 'id') get().queryGeographiesById(last.geoid)
  },
  hasManuallySelectedGeography: false,
  setHasManuallySelectedGeography: (value) =>
    set({ hasManuallySelectedGeography: value }),
  showGeographyHighlight: false,
  setShowGeographyHighlight: (show) => set({ showGeographyHighlight: show }),
  timePeriod: 'current',
  setTimePeriod: (timePeriod) => set({ timePeriod }),
  sidebarWidth: 0,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  riskConfig: RISKS.fire,
  setRiskConfig: (riskConfig) => set({ riskConfig: riskConfig }),
  colorLimits: {
    bounds: [
      RISKS.fire.binBoundaries[0],
      RISKS.fire.binBoundaries[RISKS.fire.binBoundaries.length - 1],
    ],
    binBoundaries: [...RISKS.fire.binBoundaries],
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
    const { map, selectedGeographyLevel } = get()
    if (!map) return
    const query = ++geographyQuery
    lastGeographyQuery = { kind: 'point', lng, lat }
    try {
      const activeGeographies = await lookupGeographies(
        lng,
        lat,
        map.getZoom(),
        selectedGeographyLevel,
      )
      if (query === geographyQuery) set({ activeGeographies })
    } catch (error) {
      console.error('Region lookup failed:', error)
      // show no regions rather than the last location's
      if (query === geographyQuery) set({ activeGeographies: NO_GEOGRAPHIES })
    }
  },
  queryGeographiesById: async (blockGeoid: string) => {
    const { map, selectedGeographyLevel } = get()
    if (!map) return
    const query = ++geographyQuery
    lastGeographyQuery = { kind: 'id', geoid: blockGeoid }
    try {
      const activeGeographies = await lookupGeographiesById(
        blockGeoid,
        map.getZoom(),
        selectedGeographyLevel,
      )
      if (query === geographyQuery) set({ activeGeographies })
    } catch (error) {
      console.error('Region lookup failed:', error)
      if (query === geographyQuery) set({ activeGeographies: NO_GEOGRAPHIES })
    }
  },
  // as when another building is selected: lookups in flight no longer apply,
  // and the regions shown belong to the last selection, so they are cleared
  cancelGeographyQueries: () => {
    geographyQuery++
    // the selection's own lookup follows; a level change meanwhile has nothing to repeat
    lastGeographyQuery = null
    set({ activeGeographies: NO_GEOGRAPHIES })
  },
  clearSelections: () => {
    set({
      selectedLocation: null,
      selectedBuilding: null,
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
