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
  timeHorizon: 1 | 15 | 30
  setTimeHorizon: (timeHorizon: 1 | 15 | 30) => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  currentRiskConfig: (typeof RISKS)[keyof typeof RISKS]
  setCurrentRiskConfig: (riskConfig: (typeof RISKS)[keyof typeof RISKS]) => void
  currentColorLimits: {
    type: 'continuous' | 'discrete'
    bounds: [number, number]
  }
  setCurrentColorLimits: (colorLimits: {
    type: 'continuous' | 'discrete'
    bounds: [number, number]
  }) => void
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
  timeHorizon: 30,
  setTimeHorizon: (timeHorizon) => set({ timeHorizon }),
  sidebarWidth: 0,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  currentRiskConfig: RISKS.fire,
  setCurrentRiskConfig: (riskConfig) => set({ currentRiskConfig: riskConfig }),
  currentColorLimits: {
    type: 'continuous',
    bounds: [RISKS.fire.bounds.min, RISKS.fire.bounds.max],
  },
  setCurrentColorLimits: (colorLimits) =>
    set({ currentColorLimits: colorLimits }),
}))
