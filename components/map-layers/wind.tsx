import MapLayer from './map-layer'
import { useStore } from '@/lib/store'
import { useScore } from '@/hooks/useScore'
import { RISK_LAYER_ID } from '@/lib/hazards'

const WindLayers = () => {
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectedBuilding = useStore((state) => state.selectedBuilding)

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
      ></MapLayer>
      <MapLayer
        label='Return period'
        checked={mapLayer === 'wind_speed'}
        setChecked={() => setMapLayer('wind_speed')}
        value={null}
        unit='#'
      ></MapLayer>
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
