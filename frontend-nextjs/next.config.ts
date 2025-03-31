import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_COS_BASE_URL ? new URL(process.env.NEXT_PUBLIC_COS_BASE_URL).hostname : '',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // 替换为您后端API的实际URL
      },
    ];
  },
};

export default nextConfig;
