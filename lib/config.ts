export const LAYERS = {
  buildings: {
    dataSource:
      'https://carbonplan-ocr.s3.us-west-2.amazonaws.com/intermediate/fire-risk/vector/QA/aggregated.pmtiles',
    layerName: 'risk',
    sourceId: 'buildings',
    layerIds: {
      fill: 'buildings-fill',
      line: 'buildings-line',
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
      max: 20,
    },
  },
} as const
