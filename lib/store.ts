import { create } from 'zustand'
import { Map, MapGeoJSONFeature } from 'maplibre-gl'
import {
  Location,
  Building,
  Geography,
  TimeHorizon,
  Coordinates,
  MethodKey,
  ScenarioKey,
} from '../types/location'
import { RISKS } from './config'
import { getBuildingRiskScores, getGeographyData } from './risk-utils'

type GeoJSONGeometry = MapGeoJSONFeature['geometry']
type GeoJSONProperties = MapGeoJSONFeature['properties']
type SelectedBuilding = Building & { geometry: GeoJSONGeometry }
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
  rpsRaster: boolean
  setRpsRaster: (rpsRaster: boolean) => void
  selectedBuilding: SelectedBuilding | null
  setSelectedBuilding: (feature: MapGeoJSONFeature) => void
  hoveredBuilding: Building | null
  setHoveredBuilding: (building: GeoJSONProperties | null) => void
  activeGeographies: { county: Geography | null; censusTract: Geography | null }
  setActiveGeographies: (geographies: {
    county: GeoJSONProperties | null
    censusTract: GeoJSONProperties | null
  }) => void
  geographies: { building: boolean; county: boolean; censusTract: boolean }
  setGeographies: (geographies: {
    building: boolean
    county: boolean
    censusTract: boolean
  }) => void
  timeHorizon: TimeHorizon
  setTimeHorizon: (timeHorizon: TimeHorizon) => void
  timePeriod: ScenarioKey
  setTimePeriod: (timePeriod: ScenarioKey) => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  riskConfig: RiskConfig
  setRiskConfig: (riskConfig: RiskConfig) => void
  attribute: MethodKey
  setAttribute: (attribute: MethodKey) => void
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
  setSelectedBuilding: (feature) =>
    set((state) => {
      const scores = getBuildingRiskScores(feature.properties, state.riskConfig)
      return {
        selectedBuilding: scores
          ? { ...scores, geometry: feature.geometry }
          : null,
      }
    }),
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
  setAttribute: (attribute: MethodKey) => set({ attribute }),
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
