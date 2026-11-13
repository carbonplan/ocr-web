import MapLayer from '../map-layer'
import { useStore } from '@/lib/store'
import {
  getAdjustedBurnProbability,
  getConditionalRiskUsfs,
  getSelectionProperties,
} from '@/lib/risk-utils'
import { useScore } from '@/hooks/useScore'
import { useLayerColor } from '@/hooks/useLayerColor'
import { RISK_LAYER_ID } from '@/lib/hazards'
import FireRisk from './fire-risk'
import RiskOfLoss from './risk-of-loss'
import HistoricFires, { useHistoricFires } from './historic-fires'
import { HISTORIC_FIRES_LAYER_ID } from '@/lib/historic-events'

const FireLayers = () => {
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectedBuilding = useStore((state) => state.selectedBuilding)

  const { score, value, color } = useScore(selectedBuilding, 'hinted')

  const bp = useStore((state) =>
    getAdjustedBurnProbability(getSelectionProperties(state), state.timePeriod),
  )
  const conditionalRisk = useStore((state) =>
    getConditionalRiskUsfs(getSelectionProperties(state)),
  )
  const bpColor = useLayerColor('bp', bp)
  const conditionalRiskColor = useLayerColor('crps', conditionalRisk)
  const { fires } = useHistoricFires()

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
        checked={mapLayer === 'bp'}
        unit='#'
        setChecked={() => setMapLayer('bp')}
        value={bp}
        color={bpColor}
      ></MapLayer>
      <MapLayer
        label='Conditional risk'
        checked={mapLayer === 'crps'}
        setChecked={() => setMapLayer('crps')}
        value={conditionalRisk}
        color={conditionalRiskColor}
        toFixed={1}
      ></MapLayer>
      <MapLayer
        label='Previous fires'
        checked={mapLayer === HISTORIC_FIRES_LAYER_ID}
        setChecked={() => setMapLayer(HISTORIC_FIRES_LAYER_ID)}
        value={fires ? fires.length : null}
        toFixed={0}
        unit='#'
      >
        <HistoricFires />
      </MapLayer>
    </>
  )
}

export default FireLayers
