import type { NextConfig } from "next";


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    // 允许加载图片的域名（在这里添加你需要的所有图片源）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos', // 允许 picsum.photos 的所有子域名
        pathname: '/**', // 允许所有路径
      },
      {
        protocol: 'https',
        hostname: '**.picsum.photos', // 更精确的模式，匹配所有子域名
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
