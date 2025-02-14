import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        port: '',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
