import { ReactNode } from 'react'
import { Box, Flex, useThemeUI } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Link, Colorbar } from '@carbonplan/components'
import { useStore } from '@/lib/store'
import HistoricYearFilter from './historic-year-filter'
import { FireProperties } from '@/types/location'
import {
  FIRE_MIN_YEAR,
  FIRE_MAX_YEAR,
  fireOpacityForYear,
  fireRecencyColormap,
  formatAcres,
  formatFireName,
  formatIgnitionMonthDay,
} from '@/lib/historic-utils'

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Flex sx={{ justifyContent: 'space-between', gap: 2, py: 1 }}>
    <Box variant='label' sx={{ fontSize: [1, 1, 1, 2], flexShrink: 0 }}>
      {label}
    </Box>
    <Box
      sx={{
        fontFamily: 'mono',
        fontSize: [1, 1, 1, 2],
        color: 'primary',
        textAlign: 'right',
      }}
    >
      {value}
    </Box>
  </Flex>
)

const FireCard = ({ fire }: { fire: FireProperties }) => {
  return (
    <Box sx={{ py: 3, borderTop: '1px solid', borderColor: 'muted' }}>
      <Flex sx={{ alignItems: 'center', gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '2px',
            bg: 'red',
            opacity: fireOpacityForYear(fire.year),
            flexShrink: 0,
          }}
        />
        <Box variant='description' sx={{ color: 'primary' }}>
          {formatFireName(fire.incid_name)}
        </Box>
        <Box
          sx={{
            ml: 'auto',
            fontFamily: 'mono',
            fontSize: [1, 1, 1, 2],
            color: 'secondary',
          }}
        >
          {fire.year}
        </Box>
      </Flex>
      <DetailRow
        label='Ignition'
        value={formatIgnitionMonthDay(fire.ig_date)}
      />
      <DetailRow label='Size' value={formatAcres(fire.burnbndac)} />
      <DetailRow label='Type' value={fire.incid_type || '—'} />
    </Box>
  )
}

const RecencyLegend = () => {
  const { theme } = useThemeUI()
  return (
    <Box sx={{ mt: 3, mb: 1 }}>
      <Colorbar
        horizontal
        bottom
        clim={[FIRE_MIN_YEAR, FIRE_MAX_YEAR]}
        colormap={fireRecencyColormap(theme)}
        label='Year burned'
        width='100%'
      />
    </Box>
  )
}

const HistoricResults = () => {
  const selectedFires = useStore((state) => state.selectedFires)
  const fireStartYear = useStore((state) => state.fireStartYear)
  // Only show selected fires at or after the cutoff year, so the sidebar stays
  // consistent with what's rendered on the map.
  const fires = (selectedFires ?? []).filter(
    (fire) => fire.year >= fireStartYear,
  )

  return (
    <>
      <Box as='h2' variant='sectionHeading' sx={{ mt: 3, mb: 2 }}>
        Wildfire history
      </Box>

      <RecencyLegend />

      <HistoricYearFilter />

      {fires.length > 0 && (
        <Box sx={{ mt: 4 }}>
          {fires.map((fire) => (
            <FireCard key={fire.event_id} fire={fire} />
          ))}
        </Box>
      )}

      <Box variant='description' sx={{ mt: 4, color: 'secondary' }}>
        Wildfire boundaries from the{' '}
        <Link href='https://www.mtbs.gov/'>
          Monitoring Trends in Burn Severity
        </Link>{' '}
        program (USGS/USFS), {FIRE_MIN_YEAR}&ndash;{FIRE_MAX_YEAR}.
      </Box>
    </>
  )
}

export default HistoricResults
