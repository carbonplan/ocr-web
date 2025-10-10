import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column, Toggle, Filter } from '@carbonplan/components'
import { useStore } from '../lib/store'

const Display = () => {
  const satellite = useStore((state) => state.satellite)
  const setSatellite = useStore((state) => state.setSatellite)
  const riskRaster = useStore((state) => state.riskRaster)
  const setRiskRaster = useStore((state) => state.setRiskRaster)
  const geographies = useStore((state) => state.geographies)
  const setGeographies = useStore((state) => state.setGeographies)

  return (
    <>
      <Box variant='sectionHeading'>Display</Box>
      <Row sx={{ my: 3 }} columns={[3, 3, 4, 4]}>
        <Column start={1} width={1} variant='label'>
          Geography
        </Column>
        <Column start={2} width={[2, 2, 3, 3]}>
          <Filter
            values={geographies}
            labels={{
              building: 'Building',
              county: 'County',
              censusTract: 'Census tract',
            }}
            multiSelect
            setValues={(values: Record<string, boolean>) => {
              setGeographies({
                building: true,
                county: values.county,
                censusTract: values.censusTract,
              })
            }}
          />
        </Column>
      </Row>
      <Row sx={{ my: 3 }} columns={[3, 3, 4, 4]}>
        <Column start={1} width={1} variant='label' sx={{ textWrap: 'nowrap' }}>
          Raw data
        </Column>
        <Column start={2} width={[2, 2, 3, 3]}>
          <Toggle
            value={riskRaster}
            onClick={() => setRiskRaster(!riskRaster)}
          />
        </Column>
      </Row>
      <Row sx={{ my: 3 }} columns={[3, 3, 4, 4]}>
        <Column start={1} width={1} variant='label' sx={{ textWrap: 'nowrap' }}>
          Satellite
        </Column>
        <Column start={2} width={[2, 2, 3, 3]}>
          <Toggle value={satellite} onClick={() => setSatellite(!satellite)} />
        </Column>
      </Row>
    </>
  )
}

export default Display
