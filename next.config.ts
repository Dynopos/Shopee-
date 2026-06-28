import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cf.shopee.com.my' },
      { protocol: 'https', hostname: 'down-my.img.susercontent.com' },
    ],
  },
}

export default nextConfig
