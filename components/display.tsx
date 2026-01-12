import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Row, Column, Toggle, Filter } from '@carbonplan/components'
import { useStore } from '../lib/store'

const Display = () => {
  const satellite = useStore((state) => state.satellite)
  const setSatellite = useStore((state) => state.setSatellite)
  const riskRaster = useStore((state) => state.riskRaster)
  const setRiskRaster = useStore((state) => state.setRiskRaster)
  const geographyLayerVisibility = useStore(
    (state) => state.geographyLayerVisibility,
  )
  const setGeographyLayerVisibility = useStore(
    (state) => state.setGeographyLayerVisibility,
  )

  return (
    <>
      <Box as='h2' variant='sectionHeading'>
        Display
      </Box>
      <Row sx={{ my: 3 }} columns={[3, 3, 4, 4]}>
        <Column start={1} width={1} variant='label'>
          Geography
        </Column>
        <Column start={2} width={[2, 2, 3, 3]}>
          <Filter
            role='group'
            aria-label='Select geography layers'
            variant='filter'
            values={geographyLayerVisibility}
            labels={{
              building: 'Building',
              county: 'County',
              censusTract: 'Census tract',
              censusBlock: 'Census block',
              state: 'State',
              nation: 'Nation',
            }}
            multiSelect
            setValues={(values: Record<string, boolean>) => {
              setGeographyLayerVisibility({
                building: true,
                county: values.county,
                censusTract: values.censusTract,
                censusBlock: values.censusBlock,
                state: values.state,
                nation: values.nation,
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
