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
          scriptProps={{
            src: 'https://carbonplan.org/js/script.file-downloads.outbound-links.js',
            // @ts-expect-error - following example https://github.com/4lejandrito/next-plausible/blob/8aa2279a9c2c8d03508c198abc4b219591efbc5c/test/page/pages/scriptProps.js
            'data-api': 'https://carbonplan.org/proxy/api/event',
          }}
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
