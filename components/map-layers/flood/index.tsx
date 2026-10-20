import MapLayer from '../map-layer'
import { useStore } from '@/lib/store'
import { useScore } from '@/hooks/useScore'
import { RISK_LAYER_ID } from '@/lib/hazards'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'
import HistoricFloods, { useHistoricFloods } from './historic-floods'

const FloodLayers = () => {
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectedBuilding = useStore((state) => state.selectedBuilding)

  const { score, value, color } = useScore(selectedBuilding, 'hinted')
  const { events } = useHistoricFloods()

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
        TK
      </MapLayer>
      <MapLayer
        label='Flood damage probability'
        checked={mapLayer === 'fdp'}
        setChecked={() => setMapLayer('fdp')}
        value={value}
        color={color}
        toFixed={1}
      >
        TK
      </MapLayer>
      <MapLayer
        label='Previous floods'
        checked={mapLayer === HISTORIC_FLOODS_LAYER_ID}
        setChecked={() => setMapLayer(HISTORIC_FLOODS_LAYER_ID)}
        value={events ? events.length : null}
        toFixed={0}
        unit='#'
      >
        <HistoricFloods />
      </MapLayer>
    </>
  )
}

export default FloodLayers
