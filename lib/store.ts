import { create } from 'zustand'
import { Map } from 'maplibre-gl'
import type { ZarrLayer } from '@carbonplan/zarr-layer'
import { ensureSourceLoaded } from './map-utils'
import type { ChazPointData } from './chaz-query'
import {
  Location,
  Building,
  Coordinates,
  Geography,
  GeographyKey,
} from '../types/location'
import { GEOGRAPHY_MIN_ZOOM, LAYERS } from './config'
import {
  DEFAULT_HAZARD,
  RISKS,
  RISK_LAYER_ID,
  getMapLayer,
  HazardId,
  HazardConfig,
  FutureWindow,
  SelectorDimension,
} from './hazards'
import {
  clearSelectedBuildingUrl,
  updateHazardUrl,
  updateMapViewUrl,
} from './url-utils'

export type BuildingQueryState =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'success'; value: number; detail?: ChazPointData }

const syncHazardUrl = (get: () => Store) => {
  const { hazard, futureWindow, mapLayer } = get()
  updateHazardUrl(hazard, futureWindow, mapLayer)
}

type Store = {
  map: Map | null
  setMap: (map: Map | null) => void
  selectedLocation: Location | null
  setSelectedLocation: (location: Location | null) => void
  satellite: boolean
  setSatellite: (satellite: boolean) => void
  selectedBuilding: Building | null
  setSelectedBuilding: (building: Building) => void
  // a clicked map point standing in for a building; mutually exclusive with
  // selectedBuilding
  selectedArea: Coordinates | null
  setSelectedArea: (area: Coordinates | null) => void
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
  hasManuallySelectedGeography: boolean
  setHasManuallySelectedGeography: (value: boolean) => void
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
  hazard: HazardId
  setHazard: (hazard: HazardId) => void
  futureWindow: FutureWindow
  setFutureWindow: (futureWindow: FutureWindow) => void
  // RISK_LAYER_ID for the risk view, or a HazardMapLayer id
  mapLayer: string
  setMapLayer: (mapLayer: string) => void
  selectorValues: Record<SelectorDimension, number>
  setSelectorValues: (
    update: Partial<Record<SelectorDimension, number>>,
  ) => void
  buildingQuery: BuildingQueryState
  setBuildingQuery: (buildingQuery: BuildingQueryState) => void
  zarrLayer: ZarrLayer | null
  setZarrLayer: (zarrLayer: ZarrLayer | null) => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  riskConfig: HazardConfig
  colorLimits: {
    bounds: [number, number]
    binBoundaries: number[]
  }
  setColorLimits: (colorLimits: {
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
  selectedBuilding: null,
  setSelectedBuilding: (building) =>
    set({ selectedBuilding: building, selectedArea: null }),
  selectedArea: null,
  setSelectedArea: (area) =>
    set({ selectedArea: area, selectedBuilding: null }),
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
  selectedGeographyLevel: 'nation',
  setSelectedGeographyLevel: (level) => set({ selectedGeographyLevel: level }),
  hasManuallySelectedGeography: false,
  setHasManuallySelectedGeography: (value) =>
    set({ hasManuallySelectedGeography: value }),
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
  hazard: DEFAULT_HAZARD,
  setHazard: (hazard) => {
    if (hazard === get().hazard) return
    const config = RISKS[hazard]
    set({
      hazard,
      timePeriod: config.datasets[get().timePeriod]
        ? get().timePeriod
        : 'current', // fallback to current if future unavailable
      riskConfig: config,
      mapLayer: RISK_LAYER_ID,
      colorLimits: {
        bounds: [
          config.binBoundaries[0],
          config.binBoundaries[config.binBoundaries.length - 1],
        ],
        binBoundaries: [...config.binBoundaries],
      },
      buildingQuery: { status: 'idle' },
    })
    syncHazardUrl(get)
  },
  futureWindow: 'fut1',
  setFutureWindow: (futureWindow) => {
    set({ futureWindow })
    syncHazardUrl(get)
  },
  mapLayer: RISK_LAYER_ID,
  selectorValues: { return_period: 100 },
  setSelectorValues: (values) =>
    set({ selectorValues: { ...get().selectorValues, ...values } }),
  setMapLayer: (mapLayer) => {
    if (mapLayer === get().mapLayer) return
    const config = get().riskConfig
    const layer = getMapLayer(config, mapLayer)
    const bins = layer ? layer.binBoundaries : config.binBoundaries
    set({
      mapLayer,
      colorLimits: {
        bounds: [bins[0], bins[bins.length - 1]],
        binBoundaries: [...bins],
      },
    })
    syncHazardUrl(get)
  },
  buildingQuery: { status: 'idle' },
  setBuildingQuery: (buildingQuery) => set({ buildingQuery }),
  zarrLayer: null,
  setZarrLayer: (zarrLayer) => set({ zarrLayer }),
  sidebarWidth: 0,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  riskConfig: RISKS[DEFAULT_HAZARD],
  colorLimits: {
    bounds: [
      RISKS[DEFAULT_HAZARD].binBoundaries[0],
      RISKS[DEFAULT_HAZARD].binBoundaries[
        RISKS[DEFAULT_HAZARD].binBoundaries.length - 1
      ],
    ],
    binBoundaries: [...RISKS[DEFAULT_HAZARD].binBoundaries],
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
  queryGeographiesAtPoint: async (lng: number, lat: number) => {
    const { map } = get()
    if (!map) return

    await ensureSourceLoaded(map, LAYERS.regions.sourceId)

    const zoom = map.getZoom()
    const point = map.project([lng, lat])

    const queryIfZoom = (
      minZoom: number,
      layers: string[],
    ): Geography | null => {
      if (zoom < minZoom) return null
      const features = map.queryRenderedFeatures(point, { layers })
      return features.length > 0 ? (features[0].properties as Geography) : null
    }

    // Query nation from source tiles directly (rendered features can miss)
    const queryNation = (): Geography | null => {
      const features = map.querySourceFeatures(LAYERS.nation.sourceId, {
        sourceLayer: LAYERS.nation.layerName,
      })
      return features.length > 0 ? (features[0].properties as Geography) : null
    }

    set({
      activeGeographies: {
        nation: queryNation(),
        state: queryIfZoom(GEOGRAPHY_MIN_ZOOM.state, [
          LAYERS.states.layerIds.fill,
        ]),
        county: queryIfZoom(GEOGRAPHY_MIN_ZOOM.county, [
          LAYERS.counties.layerIds.fill,
        ]),
        censusTract: queryIfZoom(GEOGRAPHY_MIN_ZOOM.censusTract, [
          LAYERS.censusTracts.layerIds.fill,
        ]),
        censusBlock: queryIfZoom(GEOGRAPHY_MIN_ZOOM.censusBlock, [
          LAYERS.censusBlocks.layerIds.fill,
        ]),
      },
    })
  },
  clearSelections: () => {
    set({
      selectedLocation: null,
      selectedBuilding: null,
      selectedArea: null,
      buildingQuery: { status: 'idle' },
      activeGeographies: {
        county: null,
        censusTract: null,
        censusBlock: null,
        state: null,
        nation: null,
      },
      showGeographyHighlight: false,
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
      queryGeographiesAtPoint(center.lng, center.lat)
    }
  },
}))
