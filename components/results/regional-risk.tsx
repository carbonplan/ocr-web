import { Box } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Filter, Table } from '@carbonplan/components'
import { useShallow } from 'zustand/react/shallow'

import ValueBadge from './value-badge'
import { useStore } from '@/lib/store'
import {
  getRiskScore,
  getGeographyRisk,
  getCountyName,
  getGeographyMedianRiskKey,
} from '@/lib/risk-utils'
import { useEffect, useState } from 'react'
import Histogram, { formatValue } from './histogram'
import { formatAddress } from '@/lib/address-utils'
import { GEOGRAPHY_ATTRIBUTE_KEYS } from '@/lib/config'

type Geography = 'county' | 'censusTract'
const RegionalRisk = () => {
  const [geography, setGeography] = useState<Geography>()
  const timePeriod = useStore((state) => state.timePeriod)
  const selectedLocation = useStore((state) => state.selectedLocation)
  const riskScore = useStore((state) =>
    getRiskScore(state.selectedBuilding, state.timePeriod),
  )

  const countyName = useStore((state) =>
    getCountyName(state.activeGeographies.county),
  )
  const activeGeography = useStore(
    useShallow((state) => geography && state.activeGeographies[geography]),
  )
  const data = useStore(
    useShallow((state) =>
      geography
        ? (getGeographyRisk(
            state.activeGeographies[geography],
            state.timePeriod,
          ) ?? [])
        : [],
    ),
  )

  useEffect(() => {
    if (!!selectedLocation && !geography) {
      setGeography('county')
    } else if (!selectedLocation && geography) {
      setGeography(undefined)
    }
  }, [geography, selectedLocation])

  return (
    <>
      <Box variant='sectionHeading'>Risk in the region</Box>
      <Filter
        values={{
          county: geography === 'county',
          censusTract: geography === 'censusTract',
        }}
        labels={{
          county: 'County',
          censusTract: 'Census tract',
        }}
        setValues={(obj: Record<Geography, boolean>) =>
          selectedLocation
            ? setGeography(
                (Object.keys(obj) as Geography[]).find(
                  (k: Geography) => obj[k],
                ),
              )
            : null
        }
      />
      <Table
        columns={3}
        start={[1, 2]}
        width={[1, 1]}
        data={[
          ['Structures', 'Median risk'],
          [
            <ValueBadge
              key='count'
              value={
                activeGeography &&
                formatValue(
                  activeGeography[GEOGRAPHY_ATTRIBUTE_KEYS.building_count],
                )
              }
              unit='#'
            />,
            <ValueBadge
              key='median'
              value={
                activeGeography &&
                activeGeography[getGeographyMedianRiskKey(timePeriod)]
              }
              unit='#'
            />,
          ],
        ]}
        index={false}
        borderTop={false}
        sx={{
          mt: 3,
          '& tr': {
            py: 2,
          },
          '& tr:first-of-type': {
            py: 1,
          },
          '& tr:first-of-type td': {
            fontFamily: 'mono',
            letterSpacing: 'mono',
            textTransform: 'uppercase',
            color: 'secondary',
            fontSize: 1,
          },
        }}
      />
      <Box sx={{ position: 'relative', mt: 3 }}>
        <Histogram
          address={
            selectedLocation?.address.houseNumber
              ? formatAddress(selectedLocation.address, true)
              : 'Selected building'
          }
          region={
            geography === 'county' ? `${countyName} County` : 'the census tract'
          }
          score={riskScore}
          data={data}
          sx={geography ? undefined : { opacity: 0.1 }}
        />
        {!geography && (
          <Box
            sx={{
              position: 'absolute',
              top: '35%',
              width: '100%',
              textAlign: 'center',
              px: 7,
              color: 'secondary',
            }}
          >
            Select a region from the options above to view risk distribution
          </Box>
        )}
      </Box>
    </>
  )
}

export default RegionalRisk
