/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint sudah dihandle di package.json
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Experimental features
  experimental: {
    // Turbopack sudah default di Next.js 16
  },
}

module.exports = nextConfig
