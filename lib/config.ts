export const LAYERS = {
  buildings: {
    dataSource:
      'https://carbonplan-ocr.s3.us-west-2.amazonaws.com/intermediate/fire-risk/vector/wind_layer_and_RPS_3_region.pmtiles',
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
      baseRisk: 'USFS_RPS',
      windRisk: 'wind_risk',
    },
    colormap: 'fire',
    bounds: {
      min: 0,
      max: 5,
      get mid() {
        return (this.max - this.min) / 2 + this.min
      },
    },
  },
} as const
