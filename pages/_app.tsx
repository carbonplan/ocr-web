import Script from 'next/script'
import { ThemeProvider } from 'theme-ui'
import '@carbonplan/components/fonts.css'
import '@carbonplan/components/globals.css'
import theme from '@/lib/theme'
import type { AppProps } from 'next/app'
// @ts-expect-error - carbonplan auth types not available
import { AuthProvider } from '@carbonplan/auth'
import { useLocationStore } from '@/store/location'

const App = ({ Component, pageProps }: AppProps) => {
  const toggleAdvancedMode = useLocationStore(
    (state) => state.toggleAdvancedMode,
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "'") {
        event.preventDefault()
        toggleAdvancedMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleAdvancedMode])

  return (
    <AuthProvider config={{ useLocalStorage: true }}>
      <ThemeProvider theme={theme}>
        {process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && (
          <Script
            data-domain='carbonplan.org'
            data-api='https://carbonplan.org/proxy/api/event'
            src='https://carbonplan.org/js/script.file-downloads.outbound-links.js'
          />
        )}
        <Component {...pageProps} />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
