import MapLayer from '../map-layer'
import { useStore } from '@/lib/store'
import { useScore } from '@/hooks/useScore'
import { RISK_LAYER_ID } from '@/lib/hazards'
import { useFdpPoint } from '@/hooks/useFdpPoint'
import { FDP_DRIVERS } from '@/lib/hazards/flood'
import Drivers from './drivers'
import StandardError, { useStandardErrorColor } from './standard-error'
import { HISTORIC_FLOODS_LAYER_ID } from '@/lib/historic-events'
import HistoricFloods, { useHistoricFloods } from './historic-floods'

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
        value={FDP_DRIVERS.length}
        unit='#'
        toFixed={0}
      >
        <Drivers point={point} />
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
