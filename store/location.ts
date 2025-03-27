import { create } from 'zustand'
import { Location } from '../types/location'

type LocationStore = {
  selectedLocation: Location | null
  setSelectedLocation: (location: Location | null) => void
}

export const useLocationStore = create<LocationStore>((set) => ({
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),
}))
