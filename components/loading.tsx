import { useBreakpointIndex } from '@theme-ui/match-media'
//@ts-expect-error - carbonplan layouts types not available
import { SidebarAttachment } from '@carbonplan/layouts'
import { useStore } from '@/lib/store'
import { Spinner } from 'theme-ui'

export default function Loading() {
  const isLoading = useStore(
    (state) => state.mapLoading || state.reverseGeocodeLoading,
  )
  const index = useBreakpointIndex({ defaultIndex: 2 })

  if (!isLoading) return null

  if (index >= 2) {
    return (
      <SidebarAttachment
        expanded={true}
        side='left'
        width={4}
        sx={{ top: '16px' }}
      >
        <Spinner size={32} />
      </SidebarAttachment>
    )
  }

  return null
}
