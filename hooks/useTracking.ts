import { useCallback } from 'react'
import { usePlausible } from 'next-plausible'

const useTracking = () => {
  const plausible = usePlausible()
  const track = useCallback(
    (event: string, options?: Record<string, string>) => {
      plausible(event, { props: { ...options } })
    },
    [plausible],
  )

  return track
}

export default useTracking
