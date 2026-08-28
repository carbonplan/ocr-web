import MapLayer from '../map-layer'
import { useStore } from '@/lib/store'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
} from '@/lib/risk-utils'
import { useScore } from '@/hooks/useScore'
import { RISK_LAYER_ID } from '@/lib/hazards'
import FireRisk from './fire-risk'
import RiskOfLoss from './risk-of-loss'

const FireLayers = () => {
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectedBuilding = useStore((state) => state.selectedBuilding)

  const { score, value, color } = useScore(selectedBuilding, 'hinted')

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
        checked={mapLayer === RISK_LAYER_ID}
        setChecked={() => setMapLayer(RISK_LAYER_ID)}
        unit='#'
      >
        <FireRisk />
      </MapLayer>
      <MapLayer
        label='Risk of loss'
        checked={mapLayer === 'rps'}
        setChecked={() => setMapLayer('rps')}
        value={value}
        color={color}
      >
        <RiskOfLoss />
      </MapLayer>
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
        toFixed={1}
      ></MapLayer>
      <MapLayer
        label='Previous fires'
        checked={false}
        setChecked={() => {}}
        value={null}
        unit='#'
      ></MapLayer>
    </>
  )
}

export default FireLayers
