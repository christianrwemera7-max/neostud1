import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    LYGOS_API_KEY: 'lygosapp-27bf5e40-8306-4fb9-9a55-31a25df41e0f',
    LYGOS_API_BASE_URL: 'https://api.lygos.app/v1',
    APP_BASE_URL: process.env.NODE_ENV === 'production' ? 'https://neostud.app' : 'http://localhost:9002',
    PAWA_ID: 'VOTRE_PAWA_ID', // Remplacez par votre Pawa ID
    PAWA_SECRET: 'VOTRE_PAWA_SECRET', // Remplacez par votre Pawa Secret
  },
};

export default nextConfig;
