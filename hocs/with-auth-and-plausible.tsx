import { ComponentType, useEffect } from 'react'
// @ts-expect-error - carbonplan auth types not available
import { useAuth, withAuth } from '@carbonplan/auth'

declare global {
  interface Window {
    plausible?: {
      init?: (options: { customProperties?: Record<string, string> }) => void
    }
  }
}

const USERS = [
  'admin',
  'user_1',
  'user_2',
  'user_3',
  'user_4',
  'user_5',
  'user_6',
  'user_7',
  'user_8',
  'user_9',
  'user_10',
  'user_11',
  'user_12',
  'user_13',
  'user_14',
  'user_15',
  'user_16',
  'user_17',
  'user_18',
  'user_19',
  'user_20',
  'user_21',
]

export function withAuthAndPlausible<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const { username } = useAuth()
    useEffect(() => {
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

  return withAuth(WrappedComponent, USERS)
}
