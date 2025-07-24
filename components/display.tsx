import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column, Toggle, Filter } from '@carbonplan/components'
import { useStore } from '../lib/store'
import { Legend } from './'

const Display = () => {
  const satellite = useStore((state) => state.satellite)
  const setSatellite = useStore((state) => state.setSatellite)
  const attribute = useStore((state) => state.attribute)
  const setAttribute = useStore((state) => state.setAttribute)
  const riskRaster = useStore((state) => state.riskRaster)
  const setRiskRaster = useStore((state) => state.setRiskRaster)
  const geographies = useStore((state) => state.geographies)
  const setGeographies = useStore((state) => state.setGeographies)
  const advancedMode = useStore((state) => state.advancedMode)

  return (
    <>
      <Box variant='sectionHeading' sx={{ mt: 5, mb: 3 }}>
        Display
      </Box>
      <Row variant='labelFieldContainer' columns={4}>
        <Column start={1} width={1} variant='label'>
          Geography
        </Column>
        <Column start={2} width={3}>
          <Filter
            values={geographies}
            multiSelect
            setValues={(values: Record<string, boolean>) => {
              setGeographies({
                building: values.building,
                county: values.county,
              })
            }}
          />
        </Column>
      </Row>
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
      {advancedMode && (
        <Row variant='labelFieldContainer' columns={4}>
          <Column
            start={1}
            width={1}
            variant='label'
            sx={{ textWrap: 'nowrap' }}
          >
            Wind Risk
          </Column>
          <Column start={2} width={3}>
            <Toggle
              value={attribute === 'windRisk'}
              onClick={() =>
                setAttribute(attribute !== 'windRisk' ? 'windRisk' : 'baseRisk')
              }
            />
          </Column>
        </Row>
      )}
      <Legend />
    </>
  )
}

export default Display
