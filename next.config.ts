const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true, // Add this to ignore ESLint warnings during build
  },
}

module.exports = nextConfig