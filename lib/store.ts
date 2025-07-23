import { create } from 'zustand'
import { Map, MapGeoJSONFeature } from 'maplibre-gl'
import { Location, Building } from '../types/location'
import { RISKS } from './config'
import { getBuildingRiskScores } from './risk-utils'

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
  setSelectedBuilding: (
    building: MapGeoJSONFeature['properties'] | null,
  ) => void
  hoveredBuilding: Building | null
  setHoveredBuilding: (building: MapGeoJSONFeature['properties'] | null) => void
  timeHorizon: 1 | 15 | 30
  setTimeHorizon: (timeHorizon: 1 | 15 | 30) => void
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
  advancedMode: boolean
  toggleAdvancedMode: () => void
}

export const useStore = create<Store>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  satellite: false,
  setSatellite: (satellite) => set({ satellite }),
  riskRaster: false,
  setRiskRaster: (riskRaster) => set({ riskRaster }),
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
  advancedMode: process.env.NEXT_PUBLIC_ADVANCED_MODE === 'true',
  toggleAdvancedMode: () =>
    set((state) => ({ advancedMode: !state.advancedMode })),
}))
