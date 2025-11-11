import { ComponentType } from 'react'
import PlausibleProvider from 'next-plausible'

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

    return (
      <>
        <PlausibleProvider
          domain='carbonplan.org'
          customDomain='https://carbonplan.org'
          enabled={process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'}
          trackOutboundLinks
          trackFileDownloads
          pageviewProps={{ user: username }}
        >
          <Component {...props} />
        </PlausibleProvider>
      </>
    )
  }

  return withAuth(WrappedComponent, USERNAMES)
}
