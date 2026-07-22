import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Naikkan limit sesuai kebutuhan, misal 10 Megabytes
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xxxxxxxxx.supabase.co', // Ganti dengan domain project Supabase lu!
        port: '',
        pathname: '/storage/v1/object/public/**', 
      },
    ],
  },

};

export default nextConfig;
