import { create } from 'zustand'
import { Map } from 'maplibre-gl'
import { Location, Building, Geography, GeographyKey } from '../types/location'
import { GEOGRAPHY_AUTOSELECT_ZOOM, LAYERS, RISKS } from './config'
import { clearSelectedBuildingUrl, updateMapViewUrl } from './url-utils'

type RiskConfig = (typeof RISKS)[keyof typeof RISKS]

type Store = {
  map: Map | null
  setMap: (map: Map | null) => void
  selectedLocation: Location | null
  setSelectedLocation: (location: Location) => void
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
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  riskConfig: RiskConfig
  setRiskConfig: (riskConfig: RiskConfig) => void
  colorLimits: {
    type: 'continuous' | 'discrete'
    bounds: [number, number]
    binBoundaries: number[]
  }
  setColorLimits: (colorLimits: {
    type: 'continuous' | 'discrete'
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
  selectedGeographyLevel: 'county',
  setSelectedGeographyLevel: (level) => set({ selectedGeographyLevel: level }),
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
  sidebarWidth: 0,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  riskConfig: RISKS.fire,
  setRiskConfig: (riskConfig) => set({ riskConfig: riskConfig }),
  colorLimits: {
    type: 'discrete',
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
  queryGeographiesAtPoint: (lng: number, lat: number) => {
    const { map } = get()
    if (!map) return

    const countyFeatures = map.queryRenderedFeatures(map.project([lng, lat]), {
      layers: [LAYERS.counties.layerIds.fill],
    })
    const tractFeatures = map.queryRenderedFeatures(map.project([lng, lat]), {
      layers: [LAYERS.censusTracts.layerIds.fill],
    })
    const blockFeatures = map.queryRenderedFeatures(map.project([lng, lat]), {
      layers: [LAYERS.censusBlocks.layerIds.fill],
    })
    const stateFeatures = map.queryRenderedFeatures(map.project([lng, lat]), {
      layers: [LAYERS.states.layerIds.fill],
    })
    const nationFeatures = map.queryRenderedFeatures(map.project([lng, lat]), {
      layers: [LAYERS.nation.layerIds.fill],
    })

    set({
      activeGeographies: {
        censusTract:
          tractFeatures.length > 0
            ? (tractFeatures[0].properties as Geography)
            : null,
        county:
          countyFeatures.length > 0
            ? (countyFeatures[0].properties as Geography)
            : null,
        censusBlock:
          blockFeatures.length > 0
            ? (blockFeatures[0].properties as Geography)
            : null,
        state:
          stateFeatures.length > 0
            ? (stateFeatures[0].properties as Geography)
            : null,
        nation:
          nationFeatures.length > 0
            ? (nationFeatures[0].properties as Geography)
            : null,
      },
    })
  },
  clearSelections: () => {
    set({
      selectedLocation: null,
      selectedBuilding: null,
      activeGeographies: {
        county: null,
        censusTract: null,
        censusBlock: null,
        state: null,
        nation: null,
      },
      showGeographyHighlight: false,
      selectedGeographyLevel: 'county',
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
      if (zoom >= GEOGRAPHY_AUTOSELECT_ZOOM) {
        queryGeographiesAtPoint(center.lng, center.lat)
      }
    }
  },
}))
