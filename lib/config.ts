export const DATA_SOURCES = {
  buildings:
    'https://carbonplan-ocr.s3.us-west-2.amazonaws.com/intermediate/fire-risk/vector/wind_layer.pmtiles',
} as const

export const LAYER_NAMES = {
  buildings: 'risk',
} as const

export const RISK_ATTRIBUTES = {
  baseRisk: 'USFS_BP',
  windRisk: 'wind_risk',
} as const

export const RISK_BOUNDS = {
  min: 0,
  max: 0.001,
  get mid() {
    return (this.max - this.min) / 2 + this.min
  },
} as const

export const MAP_LAYER_IDS = {
  buildingsFill: 'buildings-fill',
  buildingsLine: 'buildings-line',
} as const

export const MAP_SOURCE_IDS = {
  buildings: 'buildings',
} as const
