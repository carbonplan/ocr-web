import { useCallback } from 'react'
import { usePlausible } from 'next-plausible'
// @ts-expect-error - carbonplan auth types not available
import { useAuth } from '@carbonplan/auth'

const useTracking = () => {
  const { username } = useAuth()
  const plausible = usePlausible()
  const track = useCallback(
    (event: string, options?: Record<string, string>) => {
      plausible(event, { props: { ...options, user: username } })
    },
    [plausible, username],
  )

  return track
}

export default useTracking
