import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column, Toggle } from '@carbonplan/components'
import { useLocationStore } from '../store/location'
import { Legend } from './'

const Display = () => {
  const satellite = useLocationStore((state) => state.satellite)
  const setSatellite = useLocationStore((state) => state.setSatellite)
  const wind = useLocationStore((state) => state.wind)
  const setWind = useLocationStore((state) => state.setWind)
  const riskRaster = useLocationStore((state) => state.riskRaster)
  const setRiskRaster = useLocationStore((state) => state.setRiskRaster)
  const currentColorLimits = useLocationStore(
    (state) => state.currentColorLimits,
  )
  const setCurrentColorLimits = useLocationStore(
    (state) => state.setCurrentColorLimits,
  )

  return (
    <>
      <Box variant='sectionHeading' sx={{ mt: 5, mb: 3 }}>
        Display
      </Box>
      <Row variant='labelFieldContainer' columns={4}>
        <Column start={1} width={1} variant='label' sx={{ textWrap: 'nowrap' }}>
          Raw data
        </Column>
        <Column start={2} width={3}>
          <Toggle
            value={riskRaster}
            onClick={() => setRiskRaster(!riskRaster)}
          />
        </Column>
      </Row>
      <Row variant='labelFieldContainer' columns={4}>
        <Column start={1} width={1} variant='label' sx={{ textWrap: 'nowrap' }}>
          Satellite
        </Column>
        <Column start={2} width={3}>
          <Toggle value={satellite} onClick={() => setSatellite(!satellite)} />
        </Column>
      </Row>
      <Row variant='labelFieldContainer' columns={4}>
        <Column start={1} width={1} variant='label' sx={{ textWrap: 'nowrap' }}>
          Wind Risk
        </Column>
        <Column start={2} width={3}>
          <Toggle value={wind} onClick={() => setWind(!wind)} />
        </Column>
      </Row>
      <Row variant='labelFieldContainer' columns={4}>
        <Column start={1} width={1} variant='label' sx={{ textWrap: 'nowrap' }}>
          Discrete
        </Column>
        <Column start={2} width={3}>
          <Toggle
            value={currentColorLimits.type === 'discrete'}
            onClick={() =>
              setCurrentColorLimits({
                type:
                  currentColorLimits.type === 'discrete'
                    ? 'continuous'
                    : 'discrete',
                bounds: currentColorLimits.bounds,
              })
            }
          />
        </Column>
      </Row>
      <Legend />
    </>
  )
}

export default Display
