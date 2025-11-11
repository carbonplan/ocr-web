import { useEffect } from 'react'
import type { AppProps } from 'next/app'
// @ts-expect-error - carbonplan auth types not available
import { AuthProvider } from '@carbonplan/auth'
import { ThemeProvider } from 'theme-ui'
import theme from '@/lib/theme'
import { useStore } from '@/lib/store'
import '@carbonplan/components/fonts.css'
import '@carbonplan/components/globals.css'

const App = ({ Component, pageProps }: AppProps) => {
  const toggleAdvancedMode = useStore((state) => state.toggleAdvancedMode)

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
        <Component {...pageProps} />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
