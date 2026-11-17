import { useEffect, useState } from 'react'
import { Box, Flex } from 'theme-ui'
//@ts-expect-error - carbonplan components types not available
import { Expander } from '@carbonplan/components'
import { useStore } from '@/lib/store'
import { tableSx } from '../tooltip-table'

export const MAX_EVENTS = 5

// The first MAX_EVENTS of a historic events list, and the rest while
// expanded. The list collapses again for each new lookup or `resetKey`, and
// opens on its own when the selected event (say, one clicked on the map) is
// among those hidden, until it is collapsed again.
export const useShowMore = <T,>(
  items: T[] | null | undefined,
  idOf: (item: T) => string,
  resetKey?: unknown,
) => {
  const historicEvents = useStore((state) => state.historicEvents)
  const selectedEventId = useStore((state) => state.selectedEventId)
  const [expanded, setExpanded] = useState(false)
  // the selection that was hidden when the list was last collapsed
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  useEffect(() => {
    setExpanded(false)
    setDismissedId(null)
  }, [historicEvents, resetKey])

  const all = items ?? []
  const hidden = all.slice(MAX_EVENTS)
  const selectionHidden =
    selectedEventId !== null &&
    selectedEventId !== dismissedId &&
    hidden.some((item) => idOf(item) === selectedEventId)
  const open = expanded || selectionHidden

  return {
    visible: open ? all : all.slice(0, MAX_EVENTS),
    showMoreProps: {
      count: hidden.length,
      expanded: open,
      toggle: () => {
        if (open) {
          setExpanded(false)
          setDismissedId(selectedEventId)
        } else {
          setExpanded(true)
        }
      },
    },
  }
}

export const ShowMoreRow = ({
  count,
  expanded,
  toggle,
}: {
  count: number
  expanded: boolean
  toggle: () => void
}) =>
  count > 0 ? (
    <Flex
      as='label'
      sx={{
        alignItems: 'center',
        gap: 2,
        py: 2,
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover > div': { color: 'primary' },
        '&:hover svg': { stroke: 'primary' },
      }}
    >
      <Box sx={{ ...tableSx.tableHead, transition: 'color 0.15s' }}>
        {expanded ? 'Show fewer' : `Show ${count} more`}
      </Box>
      <Expander
        onClick={toggle}
        value={expanded}
        sx={{
          display: 'block',
          flexShrink: 0,
          width: [10, 10, 10, 12],
          height: [10, 10, 10, 12],
          p: 0,
          mt: ['-4px', '-4px', '-4px', '-2px'],
        }}
      />
    </Flex>
  ) : null
