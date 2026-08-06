import { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { Box, Flex } from 'theme-ui'
import { useBreakpointIndex } from '@theme-ui/match-media'
import { useShallow } from 'zustand/shallow'

import { useStore } from '@/lib/store'
import { getMapLayer } from '@/lib/hazards'
import { formatAddress } from '@/lib/address-utils'
import { useScore } from '@/hooks/useScore'
import { useColormap } from '@/lib/colormaps'
import ValueBadge from './value-badge'
import ScoreBar from './score-bar'

// bin index matching the raster shader: bin i covers [bins[i], bins[i+1]),
// with the last bin open-ended
const getBinIndex = (value: number, bins: number[]) => {
  for (let i = 0; i < bins.length - 1; i++) {
    if (value < bins[i + 1]) return i
  }
  return bins.length - 1
}

const RiskScore = () => {
  const ref = useRef<HTMLDivElement>()
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedLocation = useStore((state) => state.selectedLocation)
  const reverseGeocodeLoading = useStore((state) => state.reverseGeocodeLoading)
  const riskConfig = useStore((state) => state.riskConfig)
  const mapLayer = useStore((state) => state.mapLayer)
  const selectorValue = useStore((state) => state.mapLayerSelectorValue)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const bins = useStore(useShallow((state) => state.colorLimits.binBoundaries))
  const colormap = useColormap()
  const [abbreviate, setAbbreviate] = useState(false)
  const index = useBreakpointIndex({ defaultIndex: 2 })

  const activeLayer = getMapLayer(riskConfig, mapLayer)
  const { score, color } = useScore(selectedBuilding, 'muted')

  let content: string | ReactNode = abbreviate
    ? 'Select a building'
    : (activeLayer?.selectPrompt ?? riskConfig.selectPrompt)

  if (reverseGeocodeLoading) {
    content = <Box sx={{ color: 'secondary' }}>Loading address...</Box>
  } else if (selectedBuilding && selectedLocation) {
    content =
      formatAddress(selectedLocation.address, {
        abbreviate,
        requireStreet: true,
      }) || 'Selected building'
  }

  useLayoutEffect(() => {
    const lineHeight = index > 2 ? 25 : 22
    const shouldAbbreviate =
      !!ref.current && ref.current.clientHeight > lineHeight
    setAbbreviate(shouldAbbreviate)
  }, [reverseGeocodeLoading, selectedBuilding, selectedLocation, index])

  const detail =
    buildingQuery.status === 'success' ? buildingQuery.detail : undefined
  let layerValue: number | null = null
  if (activeLayer?.pointValue && detail) {
    const raw = activeLayer.pointValue(detail, selectorValue)
    layerValue = raw === null ? null : raw * activeLayer.unitScale
  }
  const layerBinIndex =
    layerValue === null ? null : getBinIndex(layerValue, bins)
  const layerColor =
    layerBinIndex === null
      ? undefined
      : layerValue === 0
        ? colormap[0]
        : colormap[layerBinIndex + 1]
  const layerBinLabel =
    layerBinIndex === null ? null : activeLayer?.binLabels?.[layerBinIndex]

  return (
    <>
      <Box as='h2' variant='sectionHeading' sx={{ mt: 3, mb: 2 }}>
        {activeLayer ? activeLayer.label : 'Risk score'}
      </Box>
      <Flex sx={{ gap: 3, mb: 3 }}>
        {activeLayer ? (
          <ValueBadge
            value={
              layerValue === null
                ? null
                : `${Math.round(layerValue)} ${activeLayer.unit}`
            }
            unit={activeLayer.unit}
            color={layerColor}
            sx={{
              fontSize: [3, 3, 3, 3],
              px: 3,
              pt: 0,
              height: 34,
              minWidth: [80, 80, 80, 100],
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          />
        ) : (
          <ValueBadge
            value={score}
            unit='#'
            color={score ? color : undefined}
            sx={{
              fontSize: [4, 4, 4, 4],
              width: [80, 80, 80, 100],
              height: 34,
              flexShrink: 0,
            }}
          />
        )}
        <Box ref={ref} sx={{ mt: '10px', variant: 'description' }}>
          {content}
        </Box>
      </Flex>
      {activeLayer ? (
        layerBinLabel && (
          <Box
            sx={{
              fontSize: 1,
              fontFamily: 'mono',
              letterSpacing: 'mono',
              textTransform: 'uppercase',
              color: 'secondary',
            }}
          >
            {layerBinLabel}
          </Box>
        )
      ) : (
        <ScoreBar labels />
      )}
    </>
  )
}

export default RiskScore
