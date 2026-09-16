export const HISTORIC_STORMS_LAYER_ID = 'historic_storms'
export const HISTORIC_FIRES_LAYER_ID = 'historic_fires'

// m/s -> mph
export const MPH_PER_MS = 2.23694
// IBTrACS records winds in knots
export const MPH_PER_KT = 1.15078

// Saffir-Simpson floors in mph (1-min sustained)
export const TROPICAL_STORM_MPH = 39
export const HURRICANE_MPH = 74

export const formatStormName = (name: string): string =>
  name === 'NOT_NAMED' || !name
    ? 'Unnamed storm'
    : name.charAt(0) + name.slice(1).toLowerCase()

export const formatFireName = (name: string): string => {
  const trimmed = name?.trim()
  if (!trimmed) return 'Unnamed fire'
  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
