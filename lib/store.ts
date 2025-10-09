import { create } from 'zustand'
import { Map } from 'maplibre-gl'
import { Location, Building, Geography, Coordinates } from '../types/location'
import { RISKS } from './config'

type RiskConfig = (typeof RISKS)[keyof typeof RISKS]

type Store = {
  map: Map | null
  setMap: (map: Map | null) => void
  selectedLocation: Location | null
  setSelectedLocation: (location: Location) => void
  selectedCoordinates: Coordinates | null
  setSelectedCoordinates: (coordinates: Coordinates) => void
  satellite: boolean
  setSatellite: (satellite: boolean) => void
  riskRaster: boolean
  setRiskRaster: (riskRaster: boolean) => void
  selectedBuilding: Building | null
  setSelectedBuilding: (building: Building) => void
  hoveredBuilding: Building | null
  setHoveredBuilding: (building: Building | null) => void
  activeGeographies: { county: Geography | null; censusTract: Geography | null }
  setActiveGeographies: (activeGeographies: {
    county: Geography | null
    censusTract: Geography | null
  }) => void
  geographies: { building: boolean; county: boolean; censusTract: boolean }
  setGeographies: (geographies: {
    building: boolean
    county: boolean
    censusTract: boolean
  }) => void
  timePeriod: 'current' | 'future'
  setTimePeriod: (timePeriod: 'current' | 'future') => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  riskConfig: RiskConfig
  setRiskConfig: (riskConfig: RiskConfig) => void
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
  selectedBuilding: null,
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  hoveredBuilding: null,
  setHoveredBuilding: (building) => set({ hoveredBuilding: building }),
  activeGeographies: {
    county: null,
    censusTract: null,
  },
  setActiveGeographies: ({ county, censusTract }) =>
    set({
      activeGeographies: { county, censusTract },
    }),
  geographies: { building: true, county: false, censusTract: false },
  setGeographies: (geographies) => set({ geographies }),
  timePeriod: 'current',
  setTimePeriod: (timePeriod) => set({ timePeriod }),
  sidebarWidth: 0,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  riskConfig: RISKS.fire,
  setRiskConfig: (riskConfig) => set({ riskConfig: riskConfig }),
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
