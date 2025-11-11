import { ComponentType, useCallback } from 'react'
// @ts-expect-error - carbonplan auth types not available
import { useAuth, withAuth } from '@carbonplan/auth'
import { USERNAMES } from '@/pages/api/auth'
import Script from 'next/script'

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
    const initialize = useCallback(() => {
      if (window.plausible && window.plausible.init) {
        window.plausible.init({
          customProperties: {
            user: username,
          },
        })
      }
    }, [username])

    return (
      <>
        {process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && (
          <Script
            data-domain='carbonplan.org'
            data-api='https://carbonplan.org/proxy/api/event'
            src='https://carbonplan.org/js/script.file-downloads.outbound-links.js'
            onLoad={initialize}
          />
        )}
        <Component {...props} />
      </>
    )
  }

  return withAuth(WrappedComponent, USERNAMES)
}
