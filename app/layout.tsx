import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Open Climate Risk',
  description: 'Open Climate Risk',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <head>
        <Script
          data-domain='carbonplan.org'
          data-api='https://carbonplan.org/proxy/api/event'
          src='https://carbonplan.org/js/script.file-downloads.outbound-links.js'
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
