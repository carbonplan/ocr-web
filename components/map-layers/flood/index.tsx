import MapLayer from '../map-layer'
import { useStore } from '@/lib/store'
import { useScore } from '@/hooks/useScore'
import { RISK_LAYER_ID } from '@/lib/hazards'
import Drivers from './drivers'

const FloodLayers = () => {
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectedBuilding = useStore((state) => state.selectedBuilding)

  const { score, value, color } = useScore(selectedBuilding, 'hinted')
  // the building query reads the displayed layer, so its value only belongs
  // on that layer's row
  const shown = (id: string) => (mapLayer === id ? value : null)

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
        value={shown('fdp')}
        color={color}
        toFixed={1}
      >
        TK
      </MapLayer>
      <MapLayer
        label='Standard error'
        checked={mapLayer === 'fdp_se'}
        setChecked={() => setMapLayer('fdp_se')}
        value={shown('fdp_se')}
        toFixed={1}
      >
        How much the probability here typically moves when the model is refit on
        a resample of the same flood reports. This understates the real
        uncertainty: it leaves out new reports, the choice of no-damage points,
        and errors in the model itself.
      </MapLayer>
      <MapLayer
        label='Drivers of risk'
        checked={mapLayer === 'contribution'}
        setChecked={() => setMapLayer('contribution')}
        value={shown('contribution')}
        toFixed={1}
      >
        <Drivers />
      </MapLayer>
    </>
  )
}

export default FloodLayers
