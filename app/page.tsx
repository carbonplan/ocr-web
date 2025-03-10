'use client'

import { ThemeUIProvider } from 'theme-ui'
import theme from '@carbonplan/theme'
import { Layout, Button } from '@carbonplan/components'

export default function Home() {
  return (
    <ThemeUIProvider theme={theme}>
      <Layout footer={false}>
        <main>
          <Button>open climate risk</Button>
        </main>
      </Layout>
    </ThemeUIProvider>
  )
}
