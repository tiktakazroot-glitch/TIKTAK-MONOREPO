import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'tiktak.az',
    NEXT_PUBLIC_S3_PREFIX: process.env.NEXT_PUBLIC_S3_PREFIX || 'https://s3.tiktak.az/',
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
    NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY || '',
  },
  async rewrites() {
    return [
      // Proxy video requests in development to bypass CORS
      {
        source: '/api/video-proxy/:path*',
        destination: 'https://r2.tiktak.az/:path*',
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'r2.tiktak.az',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.tiktak.az',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, '../'),
  },
};

export default withNextIntl(nextConfig);
