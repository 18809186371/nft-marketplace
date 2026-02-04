import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// IPFS 相关工具函数
export function formatIPFS(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${ipfsUrl.replace('ipfs://', '')}`
  }
  return ipfsUrl
}

// 格式化以太坊地址
export function formatAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}