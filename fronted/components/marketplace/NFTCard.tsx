'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ExternalLink, User, Tag, Clock } from 'lucide-react'
import { formatEther } from 'ethers'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NFTCardProps {
  nft: {
    id: number
    name: string
    description: string
    image: string
    price: string // wei
    seller: string
    tokenId: number
    contractAddress: string
    isListed?: boolean
  }
  showActions?: boolean
  onBuyClick?: (nft: any) => void
}

export default function NFTCard({ nft, showActions = true, onBuyClick }: NFTCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const priceInEth = formatEther(nft.price || '0')

  const handleViewDetails = () => {
    router.push(`/asset/${nft.tokenId}`)
  }

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onBuyClick) onBuyClick(nft)
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border border-gray-200 overflow-hidden",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewDetails}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <Image
          src={nft.image || '/placeholder-nft.png'}
          alt={nft.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
            <Tag className="h-3 w-3 text-white" />
            <span className="text-white font-bold text-sm">{priceInEth} ETH</span>
          </div>
        </div>

        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent",
          "opacity-0 transition-opacity duration-300",
          isHovered && "opacity-100"
        )}>
          <div className="absolute bottom-4 left-4 right-4">
            <Button 
              className="w-full bg-white text-gray-900 hover:bg-gray-100"
              onClick={handleViewDetails}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              查看详情
            </Button>
          </div>
        </div>
      </div>

      {/* NFT信息区域 */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-lg truncate mb-1">{nft.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 min-h-[40px]">
            {nft.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <User className="h-3 w-3 mr-1" />
              <span>卖家</span>
            </div>
            <span className="font-mono">{shortenAddress(nft.seller)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <span>ID</span>
            </div>
            <span className="font-mono">#{nft.tokenId}</span>
          </div>
        </div>

        {/* 行动按钮 */}
        {showActions && nft.isListed && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleBuyClick}
            >
              立即购买
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}