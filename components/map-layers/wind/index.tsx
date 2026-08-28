import MapLayer from '../map-layer'
import { useStore } from '@/lib/store'
import { useScore } from '@/hooks/useScore'
import { RISK_LAYER_ID, toDisplayUnits } from '@/lib/hazards'
import AnnualLoss from './annual-loss'
import WindRisk from './wind-risk'
import PeakWinds from './peak-winds'

const ANNUAL_LOSS_LAYER_ID = 'annual_loss'
const WIND_SPEED_LAYER_ID = 'wind_speed'

const WindLayers = () => {
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const buildingQuery = useStore((state) => state.buildingQuery)
  const returnPeriod = useStore((state) => state.selectorValues.return_period)
  const riskConfig = useStore((state) => state.riskConfig)

  const { score, color } = useScore(selectedBuilding, 'hinted')

  const detail =
    buildingQuery.status === 'success' ? buildingQuery.detail : undefined
  const rpIndex = detail ? detail.returnPeriods.indexOf(returnPeriod) : -1

  const annualLoss = toDisplayUnits(
    riskConfig,
    ANNUAL_LOSS_LAYER_ID,
    detail?.ead,
  )
  const peakWind = toDisplayUnits(
    riskConfig,
    WIND_SPEED_LAYER_ID,
    rpIndex === -1 ? null : detail?.windSpeed[rpIndex],
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
        <WindRisk />
      </MapLayer>
      <MapLayer
        label='Annual loss'
        checked={mapLayer === ANNUAL_LOSS_LAYER_ID}
        color={color}
        setChecked={() => setMapLayer(ANNUAL_LOSS_LAYER_ID)}
        value={annualLoss}
      >
        <AnnualLoss />
      </MapLayer>
      <MapLayer
        label='Peak winds'
        checked={mapLayer === WIND_SPEED_LAYER_ID}
        setChecked={() => setMapLayer(WIND_SPEED_LAYER_ID)}
        value={peakWind}
        toFixed={0}
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
