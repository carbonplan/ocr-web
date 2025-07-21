import { create } from 'zustand'
import { Map } from 'maplibre-gl'
import { Location, Building } from '../types/location'
import { RISKS } from '../lib/config'

type LocationStore = {
  map: Map | null
  setMap: (map: Map | null) => void
  selectedLocation: Location | null
  setSelectedLocation: (location: Location | null) => void
  satellite: boolean
  setSatellite: (satellite: boolean) => void
  wind: boolean
  setWind: (wind: boolean) => void
  riskRaster: boolean
  setRiskRaster: (riskRaster: boolean) => void
  selectedBuilding: Building | null
  setSelectedBuilding: (building: Building | null) => void
  hoveredBuilding: Building | null
  setHoveredBuilding: (building: Building | null) => void
  timeHorizon: 1 | 15 | 30
  setTimeHorizon: (timeHorizon: 1 | 15 | 30) => void
  timePeriod: 'current' | 'future'
  setTimePeriod: (timePeriod: 'current' | 'future') => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  riskConfig: (typeof RISKS)[keyof typeof RISKS]
  setRiskConfig: (riskConfig: (typeof RISKS)[keyof typeof RISKS]) => void
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

export const useLocationStore = create<LocationStore>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  satellite: false,
  setSatellite: (satellite) => set({ satellite }),
  wind: true,
  setWind: (wind) => set({ wind }),
  riskRaster: false,
  setRiskRaster: (riskRaster) => set({ riskRaster }),
  selectedBuilding: null,
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
  hoveredBuilding: null,
  setHoveredBuilding: (building) => set({ hoveredBuilding: building }),
  timeHorizon: 30,
  setTimeHorizon: (timeHorizon) => set({ timeHorizon }),
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
  advancedMode: false,
  toggleAdvancedMode: () =>
    set((state) => ({ advancedMode: !state.advancedMode })),
}))
