import { create } from 'zustand'
import { Map } from 'maplibre-gl'
import { ensureSourceLoaded } from './map-utils'
import {
  Location,
  Building,
  Geography,
  GeographyKey,
  FireProperties,
} from '../types/location'
import { GEOGRAPHY_MIN_ZOOM, LAYERS, RISKS } from './config'
import { FIRE_MIN_YEAR } from './historic-utils'
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
  geographyLayerVisibility: {
    building: boolean
    county: boolean
    censusTract: boolean
    censusBlock: boolean
    state: boolean
    nation: boolean
  }
  setGeographyLayerVisibility: (geographyLayerVisibility: {
    building: boolean
    county: boolean
    censusTract: boolean
    censusBlock: boolean
    state: boolean
    nation: boolean
  }) => void
  timePeriod: 'current' | 'future'
  setTimePeriod: (timePeriod: 'current' | 'future') => void

  historicMode: boolean
  setHistoricMode: (historicMode: boolean) => void
  selectedFires: FireProperties[] | null
  setSelectedFires: (fires: FireProperties[] | null) => void
  fireStartYear: number
  setFireStartYear: (year: number) => void
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
  clearSelections: () => void
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
  setSelectedGeographyLevel: (level) => set({ selectedGeographyLevel: level }),
  hasManuallySelectedGeography: false,
  setHasManuallySelectedGeography: (value) =>
    set({ hasManuallySelectedGeography: value }),
  showGeographyHighlight: false,
  setShowGeographyHighlight: (show) => set({ showGeographyHighlight: show }),
  geographyLayerVisibility: {
    building: true,
    county: false,
    censusTract: false,
    censusBlock: false,
    state: false,
    nation: false,
  },
  setGeographyLayerVisibility: (geographyLayerVisibility) =>
    set({ geographyLayerVisibility }),
  timePeriod: 'current',
  setTimePeriod: (timePeriod) => set({ timePeriod }),
  historicMode: false,
  setHistoricMode: (historicMode) => set({ historicMode }),
  selectedFires: null,
  setSelectedFires: (selectedFires) => set({ selectedFires }),
  fireStartYear: FIRE_MIN_YEAR,
  setFireStartYear: (fireStartYear) => set({ fireStartYear }),
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
    const { map } = get()
    if (!map) return

    await ensureSourceLoaded(map, LAYERS.regions.sourceId)

    const zoom = map.getZoom()
    const point = map.project([lng, lat])

    const queryIfZoom = (
      minZoom: number,
      layers: string[],
    ): Geography | null => {
      if (zoom < minZoom) return null
      const features = map.queryRenderedFeatures(point, { layers })
      return features.length > 0 ? (features[0].properties as Geography) : null
    }

    // Query nation from source tiles directly (rendered features can miss)
    const queryNation = (): Geography | null => {
      const features = map.querySourceFeatures(LAYERS.nation.sourceId, {
        sourceLayer: LAYERS.nation.layerName,
      })
      return features.length > 0 ? (features[0].properties as Geography) : null
    }

    set({
      activeGeographies: {
        nation: queryNation(),
        state: queryIfZoom(GEOGRAPHY_MIN_ZOOM.state, [
          LAYERS.states.layerIds.fill,
        ]),
        county: queryIfZoom(GEOGRAPHY_MIN_ZOOM.county, [
          LAYERS.counties.layerIds.fill,
        ]),
        censusTract: queryIfZoom(GEOGRAPHY_MIN_ZOOM.censusTract, [
          LAYERS.censusTracts.layerIds.fill,
        ]),
        censusBlock: queryIfZoom(GEOGRAPHY_MIN_ZOOM.censusBlock, [
          LAYERS.censusBlocks.layerIds.fill,
        ]),
      },
    })
  },
  clearSelections: () => {
    set({
      selectedLocation: null,
      selectedBuilding: null,
      // Historic-mode fire selection is reset here too; the HistoricFires
      // feature-state effect clears the map highlight when this goes null.
      selectedFires: null,
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
