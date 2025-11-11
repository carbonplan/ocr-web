import { ComponentType, useEffect } from 'react'
// @ts-expect-error - carbonplan auth types not available
import { useAuth, withAuth } from '@carbonplan/auth'
import { USERNAMES } from '@/pages/api/auth'

declare global {
  interface Window {
    plausible?: {
      init?: (options: { customProperties?: Record<string, string> }) => void
    }
  }
}

export function withAuthAndPlausible<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const { username } = useAuth()
    useEffect(() => {
      // TODO: Figure out how to get this to run when window.plausible has been initialized
      //       (currently always undefined at the time this useEffect() is invoked)
      if (window.plausible && window.plausible.init) {
        window.plausible.init({
          customProperties: {
            user: username,
          },
        })
      }
    }, [username])

    return <Component {...props} />
  }

  return withAuth(WrappedComponent, USERNAMES)
}
