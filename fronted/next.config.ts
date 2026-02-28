import type { NextConfig } from "next";


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/ipfs/**', // This pattern matches the path in your error
      },
      // 如果未来需要其他图床，在这里添加
      // {
      //   protocol: 'https',
      //   hostname: 'ipfs.io',
      // },
      // {
      //   protocol: 'https',
      //   hostname: '**.nftstorage.link',
      // },
    ],
  },
}

export default nextConfig;
