import { useStore } from '@/lib/store'
import { useColormap } from '@/lib/colormaps'
import { getMapLayer, toDisplayUnits } from '@/lib/hazards'
import { getBinIndex } from '@/hooks/useLayerColor'

export const WIND_SPEED_LAYER_ID = 'wind_speed'

// Peak 1-min sustained wind at the selected return period, in display units,
// alongside the Saffir-Simpson color the map paints that value.
export const usePeakWind = () => {
  const buildingQuery = useStore((state) => state.buildingQuery)
  const returnPeriod = useStore((state) => state.selectorValues.return_period)
  const riskConfig = useStore((state) => state.riskConfig)

  const bins = getMapLayer(riskConfig, WIND_SPEED_LAYER_ID)?.binBoundaries
  const colormap = useColormap({ count: bins?.length })

  const detail =
    buildingQuery.status === 'success' ? buildingQuery.detail : undefined
  const rpIndex = detail ? detail.returnPeriods.indexOf(returnPeriod) : -1
  const value = toDisplayUnits(
    riskConfig,
    WIND_SPEED_LAYER_ID,
    rpIndex === -1 ? null : detail?.windSpeed[rpIndex],
  )

  return {
    value,
    color: !value || !bins ? undefined : colormap[getBinIndex(bins, value) + 1],
  }
}
