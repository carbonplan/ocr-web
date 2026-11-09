import MapLayer from '../map-layer'
import { useStore } from '@/lib/store'
import { useScore } from '@/hooks/useScore'
import { RISK_LAYER_ID } from '@/lib/hazards'
import { useFdpPoint } from '@/hooks/useFdpPoint'
import Drivers from './drivers'
import StandardError, { useStandardErrorColor } from './standard-error'

const FloodLayers = () => {
  const mapLayer = useStore((state) => state.mapLayer)
  const setMapLayer = useStore((state) => state.setMapLayer)
  const selectedBuilding = useStore((state) => state.selectedBuilding)

  const { score, value, color } = useScore(selectedBuilding, 'hinted')
  // the building query reads the displayed layer, so its value only belongs
  // on that layer's row
  const shown = (id: string) => (mapLayer === id ? value : null)
  // every variable at the selection, read once for the sections below
  const point = useFdpPoint()
  const seColor = useStandardErrorColor(shown('fdp_se'))

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
        color={seColor}
        toFixed={1}
      >
        <StandardError point={point} />
      </MapLayer>
      <MapLayer
        label='Drivers of risk'
        checked={mapLayer === 'contribution'}
        setChecked={() => setMapLayer('contribution')}
        value={9}
        unit='#'
        toFixed={0}
      >
        <Drivers point={point} />
      </MapLayer>
    </>
  )
}

export default FloodLayers
