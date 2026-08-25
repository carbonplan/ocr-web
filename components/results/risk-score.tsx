import { Box } from 'theme-ui'
import { useShallow } from 'zustand/shallow'

import { useStore } from '@/lib/store'
import { getMapLayer } from '@/lib/hazards'
import ScoreBar from './score-bar'

// matches the raster shader: bin i covers [bins[i], bins[i+1]), last open-ended
const getBinIndex = (value: number, bins: number[]) => {
  for (let i = 0; i < bins.length - 1; i++) {
    if (value < bins[i + 1]) return i
  }
  return bins.length - 1
}

const RiskScore = () => {
  const riskConfig = useStore((state) => state.riskConfig)
  const mapLayer = useStore((state) => state.mapLayer)
  const selectorValue = useStore((state) => state.mapLayerSelectorValue)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))

  const activeLayer = getMapLayer(riskConfig, mapLayer)

  const detail =
    buildingQuery.status === 'success' ? buildingQuery.detail : undefined
  let layerValue: number | null = null
  if (activeLayer?.pointValue && detail) {
    const raw = activeLayer.pointValue(detail, selectorValue)
    layerValue = raw === null ? null : raw * activeLayer.unitScale
  }

  let layerBinIndex, layerBinLabel
  if (layerValue !== null) {
    layerBinIndex = getBinIndex(layerValue, bins)
    layerBinLabel = activeLayer?.binLabels?.[layerBinIndex]
  }

  return (
    <Box sx={{ mt: 3 }}>
      {activeLayer ? (
        // fixed height so the label clearing doesn't shift the sections below
        <Box
          sx={{
            fontSize: 1,
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            color: 'secondary',
            minHeight: '20px',
          }}
        >
          {layerBinLabel ?? ' '}
        </Box>
      ) : (
        <ScoreBar labels />
      )}
    </Box>
  )
}

export default RiskScore
