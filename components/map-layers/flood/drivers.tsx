import { Box } from 'theme-ui'
import {
  Select,
  //@ts-expect-error - carbonplan components types not available
} from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { FDP_DRIVERS } from '@/lib/hazards/flood'

const DriverSelect = () => {
  const driver = useStore((state) => state.selectorValues.driver)
  const setSelectorValues = useStore((state) => state.setSelectorValues)

  return (
    <Box>
      How much{' '}
      <Select
        value={driver}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSelectorValues({ driver: Number(e.target.value) })
        }
        size='xs'
        sx={{ mb: ['-5px'] }}
      >
        {FDP_DRIVERS.map((d, i) => (
          <option key={d.short} value={i}>
            {d.label.toLowerCase()}
          </option>
        ))}
      </Select>{' '}
      raises or lowers the probability here, along the model&apos;s decision
      paths.
    </Box>
  )
}

export default DriverSelect
