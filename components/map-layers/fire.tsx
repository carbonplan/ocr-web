import MapLayer from './map-layer'
import { useStore } from '@/lib/store'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
  getRiskScore,
} from '@/lib/risk-utils'
import { useScore } from '@/hooks/useScore'

const FireLayers = () => {
  const riskRaster = useStore((state) => state.riskRaster)
  const setRiskRaster = useStore((state) => state.setRiskRaster)
  const selectedBuilding = useStore((state) => state.selectedBuilding)

  const { score, color } = useScore(selectedBuilding, 'hinted')

  const risk = useStore((state) =>
    getRiskScore(state.selectedBuilding, state.timePeriod),
  )
  const bp = useStore((state) =>
    getAdjustedBurnProbability(state.selectedBuilding, state.timePeriod),
  )
  const conditionalRisk = useStore((state) =>
    getConditionalRiskUsfs(state.selectedBuilding),
  )

  return (
    <>
      <MapLayer
        label='Risk score'
        value={score}
        color={color}
        checked
        setChecked={() => {}}
        unit='#'
      ></MapLayer>
      <MapLayer
        label='Risk of loss'
        checked={riskRaster}
        setChecked={setRiskRaster}
        value={risk}
      ></MapLayer>
      <MapLayer
        label='Burn probability'
        checked={false}
        setChecked={() => {}}
        value={bp}
      ></MapLayer>
      <MapLayer
        label='Conditional risk'
        checked={false}
        setChecked={() => {}}
        value={conditionalRisk}
      ></MapLayer>
      <MapLayer
        label='Previous fires'
        checked={false}
        setChecked={() => {}}
        value={'TK'}
        unit='#'
      ></MapLayer>
    </>
  )
}

export default FireLayers
