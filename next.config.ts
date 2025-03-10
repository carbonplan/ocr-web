import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'), // allows turbopack to resolve locally linked packages https://github.com/vercel/next.js/issues/64472#issuecomment-2077483493
}

export default nextConfig
