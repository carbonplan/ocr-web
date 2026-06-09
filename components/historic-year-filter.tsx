import { ChangeEvent, useEffect, useId, useRef, useState } from 'react'
import { Box, Flex } from 'theme-ui'
import AnimateHeight from 'react-animate-height'
//@ts-expect-error - carbonplan components types not available
import { Slider, Link } from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { Tooltip } from './tooltip'
import { FIRE_MIN_YEAR, FIRE_MAX_YEAR } from '@/lib/historic-utils'

const HistoricYearFilter = () => {
  const fireStartYear = useStore((state) => state.fireStartYear)
  const setFireStartYear = useStore((state) => state.setFireStartYear)

  // The thumb is driven by local state so dragging never touches the map; the
  // cutoff (an expensive paint re-evaluation over all features) is committed
  // only when the drag is released.
  const [value, setValue] = useState(fireStartYear)
  const valueRef = useRef(value)
  valueRef.current = value
  const draggingRef = useRef(false)

  const [infoExpanded, setInfoExpanded] = useState(false)
  const infoId = useId()

  useEffect(() => {
    if (!draggingRef.current) setValue(fireStartYear)
  }, [fireStartYear])

  useEffect(() => {
    const commit = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      setFireStartYear(valueRef.current)
    }
    window.addEventListener('mouseup', commit)
    window.addEventListener('touchend', commit)
    return () => {
      window.removeEventListener('mouseup', commit)
      window.removeEventListener('touchend', commit)
    }
  }, [setFireStartYear])

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value)
    setValue(next)
    // Keyboard changes have no pointer release — commit immediately.
    if (!draggingRef.current) setFireStartYear(next)
  }
  const onDown = () => {
    draggingRef.current = true
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Flex
        sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}
      >
        <Flex sx={{ alignItems: 'center', gap: 2 }}>
          <Box variant='label'>Years shown</Box>
          <Tooltip
            expanded={infoExpanded}
            setExpanded={setInfoExpanded}
            aria-controls={infoId}
            aria-label='About MTBS data currency'
            sx={{ mb: '-3px' }}
          />
        </Flex>
        <Box
          sx={{
            fontFamily: 'mono',
            fontSize: [1, 1, 1, 2],
            color: 'primary',
          }}
        >
          {value} - {FIRE_MAX_YEAR}
        </Box>
      </Flex>
      <AnimateHeight
        duration={100}
        height={infoExpanded ? 'auto' : 0}
        easing='linear'
      >
        <Box
          id={infoId}
          sx={{ mb: 4, fontSize: [1, 1, 1, 2], color: 'secondary' }}
        >
          MTBS maps each fire from satellite imagery in the growing season after
          it burns, so the most recent year or two stays incomplete. This layer
          shows data through {FIRE_MAX_YEAR}, the latest reasonably complete
          year.{' '}
          <Link href='https://www.mtbs.gov/data-availability'>
            Data availability
          </Link>
        </Box>
      </AnimateHeight>
      <Slider
        min={FIRE_MIN_YEAR}
        max={FIRE_MAX_YEAR}
        step={1}
        value={value}
        onChange={onChange}
        onMouseDown={onDown}
        onTouchStart={onDown}
        aria-label='Earliest fire year to show'
      />
    </Box>
  )
}

export default HistoricYearFilter
