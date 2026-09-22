import type { NextConfig } from 'next';

import { IMAGE_HOST_EXACT, IMAGE_HOST_SUFFIX } from './lib/images';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      ...IMAGE_HOST_EXACT.map((hostname) => ({ protocol: 'https' as const, hostname })),
      // FAZ serves from numbered hosts: media0.faz.net, media1.faz.net, …
      ...IMAGE_HOST_SUFFIX.map((suffix) => ({
        protocol: 'https' as const,
        hostname: `**${suffix}`,
      })),
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  experimental: {
    optimizePackageImports: ['geist'],
  },
};

export default nextConfig;
