import { useEffect, useMemo, useState } from 'react'
import { Box, Flex } from 'theme-ui'
import { centerOfMass } from '@turf/turf'
import { useStore } from '@/lib/store'
import { FDP_DRIVERS } from '@/lib/hazards/flood'
import {
  getMapLayer,
  resolveHazardDataset,
  toDisplayUnits,
} from '@/lib/hazards'
import { getZarrLayerId, queryRasterPoint } from '@/lib/raster-query'
import ValueBadge from '../../value-badge'
import { tableSx } from '../../tooltip-table'

const LAYER_ID = 'contribution'

type DriverQuery =
  | { status: 'idle' | 'loading' | 'error' }
  | { status: 'success'; values: (number | null)[] }

// Every driver's contribution at the selected point, in display units. Reads
// through the contribution layer, so it only runs while that layer is shown.
const useDriverContributions = (): DriverQuery => {
  const selectedBuilding = useStore((state) => state.selectedBuilding)
  const selectedArea = useStore((state) => state.selectedArea)
  const riskConfig = useStore((state) => state.riskConfig)
  const timePeriod = useStore((state) => state.timePeriod)
  const futureWindow = useStore((state) => state.futureWindow)
  const zarrLayer = useStore((state) => state.zarrLayer)
  const [query, setQuery] = useState<DriverQuery>({ status: 'idle' })

  useEffect(() => {
    const layer = getMapLayer(riskConfig, LAYER_ID)
    if (!layer?.variable || !layer.selector) return
    if (!selectedBuilding && !selectedArea) {
      setQuery({ status: 'idle' })
      return
    }

    const dataset = resolveHazardDataset(riskConfig, {
      timePeriod,
      futureWindow,
    })
    setQuery({ status: 'loading' })
    // the store's layer may still be another variable's; the effect re-runs
    // once the contribution layer is in place
    if (zarrLayer?.id !== getZarrLayerId(dataset.source, layer.variable)) {
      return
    }

    const point = selectedArea
      ? ([selectedArea.lng, selectedArea.lat] as [number, number])
      : (centerOfMass(selectedBuilding!).geometry.coordinates as [
          number,
          number,
        ])
    const range = layer.validRange
    const controller = new AbortController()

    queryRasterPoint(
      zarrLayer,
      layer.variable,
      point,
      controller.signal,
      layer.selector,
    )
      .then((raw) => {
        if (controller.signal.aborted) return
        const values = raw.map((value) =>
          value === null || (range && (value < range[0] || value > range[1]))
            ? null
            : toDisplayUnits(riskConfig, LAYER_ID, value),
        )
        setQuery(
          values.every((v) => v === null)
            ? { status: 'error' }
            : { status: 'success', values },
        )
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.error('Driver query failed:', error)
        setQuery({ status: 'error' })
      })

    return () => controller.abort()
  }, [
    selectedBuilding,
    selectedArea,
    riskConfig,
    timePeriod,
    futureWindow,
    zarrLayer,
  ])

  return query
}

const Drivers = () => {
  const driver = useStore((state) => state.selectorValues.driver)
  const setSelectorValues = useStore((state) => state.setSelectorValues)
  const query = useDriverContributions()
  const values = query.status === 'success' ? query.values : null

  // largest raise first, largest drop last; store order until there are values
  const rows = useMemo(() => {
    const rows = FDP_DRIVERS.map((d, i) => ({
      ...d,
      index: i,
      value: values?.[i] ?? null,
    }))
    if (!values) return rows
    return rows.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
  }, [values])

  return (
    <Box>
      How much each predictor raises or lowers the probability here, along the
      model&apos;s decision paths. Select one to map it.
      <Box sx={{ mt: 3 }}>
        <Flex
          sx={{
            ...tableSx.row,
            justifyContent: 'space-between',
            alignItems: 'baseline',
            py: 1,
          }}
        >
          <Box sx={tableSx.tableHead}>Driver</Box>
          <Box sx={tableSx.tableHead}>Change</Box>
        </Flex>
        {rows.map(({ label, short, index, value }) => {
          const selected = index === driver
          return (
            <Flex
              key={short}
              as='button'
              onClick={() => setSelectorValues({ driver: index })}
              aria-pressed={selected}
              sx={{
                ...tableSx.row,
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 2,
                py: 2,
                px: 0,
                bg: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                fontFamily: 'body',
                fontSize: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                color: selected ? 'primary' : 'secondary',
                transition: 'color 0.2s',
                '&:hover': { color: 'primary' },
              }}
            >
              <Box>{label}</Box>
              <ValueBadge value={value} toFixed={1} sx={{ flexShrink: 0 }} />
            </Flex>
          )
        })}
      </Box>
      {query.status === 'error' && (
        <Box variant='description' sx={{ mt: 2, color: 'secondary' }}>
          No driver data is available for this location.
        </Box>
      )}
    </Box>
  )
}

export default Drivers
