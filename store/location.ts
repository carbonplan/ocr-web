import { create } from 'zustand'
import { Map } from 'maplibre-gl'
import { Location, Building } from '../types/location'

type LocationStore = {
  map: Map | null
  setMap: (map: Map | null) => void
  selectedLocation: Location | null
  setSelectedLocation: (location: Location | null) => void
  satellite: boolean
  setSatellite: (satellite: boolean) => void
  selectedBuilding: Building | null
  setSelectedBuilding: (building: Building | null) => void
}

export const useLocationStore = create<LocationStore>((set) => ({
  map: null,
  setMap: (map) => set({ map }),
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  satellite: false,
  setSatellite: (satellite) => set({ satellite }),
  selectedBuilding: null,
  setSelectedBuilding: (building) => set({ selectedBuilding: building }),
}))
