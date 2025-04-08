import { create } from 'zustand'
import { Location, Building } from '../types/location'

type LocationStore = {
  selectedLocation: Location | null
  setSelectedLocation: (location: Location | null) => void
  satellite: boolean
  setSatellite: (satellite: boolean) => void
  selectedBuilding: Building | null
  setSelectedBuilding: (building: Building | null) => void
}

export const useLocationStore = create<LocationStore>((set) => ({
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  satellite: false,
  setSatellite: (satellite) => set({ satellite }),
  selectedBuilding: null,
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
}))
