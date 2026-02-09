import { useEffect } from 'react'
import type { AppProps } from 'next/app'
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
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default App
