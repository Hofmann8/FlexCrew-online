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
        destination: 'http://124.222.106.161:5000/api/:path*', // 使用远程服务器地址
      },
    ];
  },
};

export default nextConfig;
