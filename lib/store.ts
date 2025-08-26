import { create } from 'zustand'
import { Map, MapGeoJSONFeature } from 'maplibre-gl'
import { Location, Building, Geography, TimeHorizon } from '../types/location'
import { RISKS } from './config'
import { getBuildingRiskScores, getGeographyData } from './risk-utils'

type Store = {
  map: Map | null
  setMap: (map: Map | null) => void
  selectedLocation: Location | null
  setSelectedLocation: (location: Location) => void
  selectedCoordinates: { lat: number; lng: number } | null
  setSelectedCoordinates: (coordinates: { lat: number; lng: number }) => void
  satellite: boolean
  setSatellite: (satellite: boolean) => void
  riskRaster: boolean
  setRiskRaster: (riskRaster: boolean) => void
  rpsRaster: boolean
  setRpsRaster: (rpsRaster: boolean) => void
  selectedBuilding: Building | null
  setSelectedBuilding: (building: MapGeoJSONFeature['properties']) => void
  hoveredBuilding: Building | null
  setHoveredBuilding: (building: MapGeoJSONFeature['properties'] | null) => void
  activeGeographies: { county: Geography | null; censusTract: Geography | null }
  setActiveGeographies: (geographies: {
    county: MapGeoJSONFeature['properties'] | null
    censusTract: MapGeoJSONFeature['properties'] | null
  }) => void
  geographies: { building: boolean; county: boolean; censusTract: boolean }
  setGeographies: (geographies: {
    building: boolean
    county: boolean
    censusTract: boolean
  }) => void
  timeHorizon: TimeHorizon
  setTimeHorizon: (timeHorizon: TimeHorizon) => void
  timePeriod: 'current' | 'future'
  setTimePeriod: (timePeriod: 'current' | 'future') => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  riskConfig: (typeof RISKS)[keyof typeof RISKS]
  setRiskConfig: (riskConfig: (typeof RISKS)[keyof typeof RISKS]) => void
  attribute: 'baseRisk' | 'windRisk'
  setAttribute: (attribute: 'baseRisk' | 'windRisk') => void
  colorLimits: {
    type: 'continuous' | 'discrete'
    bounds: [number, number]
  }
  setColorLimits: (colorLimits: {
    type: 'continuous' | 'discrete'
    bounds: [number, number]
  }) => void
  mapLoading: boolean
  setMapLoading: (mapLoading: boolean) => void
  reverseGeocodeLoading: boolean
  setReverseGeocodeLoading: (reverseGeocodeLoading: boolean) => void
  showAddressDetails: boolean
  setShowAddressDetails: (showAddressDetails: boolean) => void
  advancedMode: boolean
  toggleAdvancedMode: () => void
  clearSelections: () => void
}

export const useStore = create<Store>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  selectedCoordinates: null,
  setSelectedCoordinates: (coordinates) =>
    set({ selectedCoordinates: coordinates }),
  satellite: false,
  setSatellite: (satellite) => set({ satellite }),
  riskRaster: false,
  setRiskRaster: (riskRaster) => set({ riskRaster }),
  rpsRaster: false,
  setRpsRaster: (rpsRaster) => set({ rpsRaster }),
  selectedBuilding: null,
  setSelectedBuilding: (building) =>
    set((state) => ({
      selectedBuilding: getBuildingRiskScores(building, state.riskConfig),
    })),
  hoveredBuilding: null,
  setHoveredBuilding: (building) =>
    set((state) => ({
      hoveredBuilding: getBuildingRiskScores(building, state.riskConfig),
    })),
  activeGeographies: {
    county: null,
    censusTract: null,
  },
  setActiveGeographies: ({ county, censusTract }) =>
    set((state) => ({
      activeGeographies: {
        county: getGeographyData(county, state.riskConfig, 'county_name'),
        censusTract: getGeographyData(
          censusTract,
          state.riskConfig,
          'tract_geoid',
        ),
      },
    })),
  geographies: { building: true, county: false, censusTract: false },
  setGeographies: (geographies) => set({ geographies }),
  timeHorizon: 1,
  setTimeHorizon: (timeHorizon) => set({ timeHorizon }),
  timePeriod: 'current',
  setTimePeriod: (timePeriod) => set({ timePeriod }),
  sidebarWidth: 0,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  riskConfig: RISKS.fire,
  setRiskConfig: (riskConfig) => set({ riskConfig: riskConfig }),
  attribute: 'windRisk',
  setAttribute: (attribute: 'baseRisk' | 'windRisk') => set({ attribute }),
  colorLimits: {
    type: 'continuous',
    bounds: [RISKS.fire.bounds.min, RISKS.fire.bounds.max],
  },
  setColorLimits: (colorLimits) => set({ colorLimits: colorLimits }),
  mapLoading: false,
  setMapLoading: (mapLoading) => set({ mapLoading }),
  reverseGeocodeLoading: false,
  setReverseGeocodeLoading: (reverseGeocodeLoading) =>
    set({ reverseGeocodeLoading }),
  showAddressDetails: false,
  setShowAddressDetails: (showAddressDetails) => set({ showAddressDetails }),
  advancedMode: process.env.NEXT_PUBLIC_ADVANCED_MODE === 'true',
  toggleAdvancedMode: () =>
    set((state) => ({ advancedMode: !state.advancedMode })),
  clearSelections: () =>
    set({
      selectedLocation: null,
      selectedBuilding: null,
      selectedCoordinates: null,
      activeGeographies: { county: null, censusTract: null },
    }),
}))
