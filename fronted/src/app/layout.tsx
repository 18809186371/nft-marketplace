import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/components/Web3Provider' // 导入
import { ToastContainer } from 'react-toastify'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NFT Marketplace (ethers.js)',
  description: 'A minimal OpenSea clone using ethers.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 使用 Web3Provider */}
        <Web3Provider>
          {children}
          <ToastContainer position="bottom-right" />
        </Web3Provider>
      </body>
    </html>
  )
}