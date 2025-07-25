export const LAYERS = {
  buildings: {
    layerName: 'risk',
    sourceId: 'buildings',
    layerIds: {
      fill: 'risk-buildings-fill',
      line: 'risk-buildings-line',
    },
  },
  counties: {
    layerName: 'risk',
    sourceId: 'counties',
    layerIds: {
      fill: 'risk-counties-fill',
      line: 'risk-counties-line',
    },
  },
  censusTracts: {
    layerName: 'risk',
    sourceId: 'census-tracts',
    layerIds: {
      fill: 'risk-census-tracts-fill',
      line: 'risk-census-tracts-line',
    },
  },
} as const

export const RISKS = {
  fire: {
    attributes: {
      baseRisk: {
        current: 'risk_2011',
        future: 'risk_2047',
      },
      windRisk: {
        current: 'wind_risk_2011',
        future: 'wind_risk_2047',
      },
    },
    colormap: 'fire-risk',
    binRatios: [0.1, 0.2, 0.5, 1],
    bounds: {
      min: 0.005,
      max: 100,
    },
  },
} as const
