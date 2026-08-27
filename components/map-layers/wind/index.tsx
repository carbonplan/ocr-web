import MapLayer from '../map-layer'
import { useStore } from '@/lib/store'
import { useScore } from '@/hooks/useScore'
import { RISK_LAYER_ID } from '@/lib/hazards'
import AnnualLoss from './annual-loss'
import WindRisk from './wind-risk'
import PeakWinds from './peak-winds'

const WindLayers = () => {
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const buildingQuery = useStore((state) => state.buildingQuery)

  const { score, color } = useScore(selectedBuilding, 'hinted')

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
        <WindRisk />
      </MapLayer>
      <MapLayer
        label='Annual loss'
        checked={mapLayer === 'annual_loss'}
        color={color}
        setChecked={() => setMapLayer('annual_loss')}
        value={buildingQuery.status === 'success' ? buildingQuery.value : null}
      >
        <AnnualLoss />
      </MapLayer>
      <MapLayer
        label='Peak winds'
        checked={mapLayer === 'wind_speed'}
        setChecked={() => setMapLayer('wind_speed')}
        value={null}
        unit='#'
      >
        <PeakWinds />
      </MapLayer>
      <MapLayer
        label='Previous wind events'
        checked={false}
        setChecked={() => {}}
        value={null}
        unit='#'
      ></MapLayer>
    </>
  )
}

export default WindLayers
