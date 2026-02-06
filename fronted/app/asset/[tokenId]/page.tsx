'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { 
  Heart, Share2, AlertCircle, 
  User, Tag, Globe, Clock,
  Shield, CheckCircle
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { formatEther } from 'ethers'

// 模拟NFT详情数据
const mockNFTDetail = {
  id: 1,
  tokenId: 1,
  name: 'Crypto Punk #9999',
  description: 'This rare CryptoPunk features a unique combination of attributes including wild hair, 3D glasses, and a medical mask. One of only 10,000 ever created, it represents a significant piece of crypto history.',
  image: 'https://picsum.photos/seed/nftdetail/800/800',
  price: '100000000000000000', // 0.1 ETH in wei
  seller: '0x742d35Cc6634C0532925a3b844Bc9e100E090b0C',
  owner: '0x742d35Cc6634C0532925a3b844Bc9e100E090b0C',
  contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  isListed: true,
  attributes: [
    { trait_type: '稀有度', value: '传奇', rarity: '1%' },
    { trait_type: '背景', value: '蓝色', rarity: '12%' },
    { trait_type: '类型', value: '外星人', rarity: '0.09%' },
    { trait_type: '配饰', value: '3D眼镜', rarity: '2.3%' },
  ],
  history: [
    { event: '铸造', from: '空地址', to: '0x123...', date: '2023-10-01', price: '0 ETH' },
    { event: '上架', from: '0x123...', to: '市场', date: '2023-10-05', price: '0.1 ETH' },
  ]
}

export default function AssetDetailPage() {
  const params = useParams()
  const [nft, setNft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    loadNFTDetail()
  }, [params.tokenId])

  const loadNFTDetail = async () => {
    setLoading(true)
    try {
      // 实际应从合约获取NFT详情
      await new Promise(resolve => setTimeout(resolve, 800))
      setNft(mockNFTDetail)
    } catch (error) {
      console.error('加载NFT详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async () => {
    // 实际购买逻辑 - 调用合约的 buyItem 函数
    console.log('购买NFT:', nft)
    // 需要: 1. 连接钱包 2. 调用合约 3. 处理交易结果
  }

  const handleMakeOffer = () => {
    console.log('出价')
  }

  if (loading || !nft) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <div className="mb-8 text-sm text-gray-600">
          <span className="hover:text-purple-600 cursor-pointer">市场</span>
          <span className="mx-2">/</span>
          <span className="hover:text-purple-600 cursor-pointer">收藏品</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{nft.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左侧：NFT图片 */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl">
              <Image
                src={nft.image}
                alt={nft.name}
                fill
                className="object-cover"
                priority
              />
              <button 
                className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* 属性标签 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">属性</h3>
              <div className="grid grid-cols-2 gap-3">
                {nft.attributes.map((attr: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">{attr.trait_type}</div>
                    <div className="font-bold mb-1">{attr.value}</div>
                    <div className="text-xs text-purple-600">{attr.rarity} 拥有</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：NFT信息 */}
          <div className="space-y-8">
            {/* 标题和基本信息 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold">{nft.name}</h1>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>拥有者:</span>
                  <span className="font-mono font-medium">
                    {nft.owner.slice(0, 8)}...{nft.owner.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="h-4 w-4" />
                  <span>以太坊</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-8">
                {nft.description}
              </p>
            </div>

            {/* 价格和购买区域 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-gray-600 mb-1">当前价格</div>
                  <div className="text-5xl font-bold">
                    {formatEther(nft.price)} ETH
                  </div>
                  <div className="text-gray-600 mt-2">≈ $420.50</div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    已验证合约
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={handleBuy}
                >
                  立即购买
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full py-6 text-lg"
                  onClick={handleMakeOffer}
                >
                  出价购买
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-purple-100">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>卖家</span>
                    <span className="font-mono">{nft.seller.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>合约地址</span>
                    <span className="font-mono">{nft.contractAddress.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Token ID</span>
                    <span className="font-mono">#{nft.tokenId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">详细信息</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="h-4 w-4" />
                    <span>合约标准</span>
                  </div>
                  <span className="font-medium">ERC-721</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="h-4 w-4" />
                    <span>链上元数据</span>
                  </div>
                  <span className="font-medium">已存储</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>上架时间</span>
                  </div>
                  <span className="font-medium">2天前</span>
                </div>
              </div>
            </div>

            {/* 安全提示 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-2 text-yellow-800">购买前请确认</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• 确认你已连接正确的钱包地址</li>
                    <li>• 检查网络是否为 Sepolia 测试网</li>
                    <li>• 确保有足够的 ETH 支付 Gas 费</li>
                    <li>• 购买后 NFT 将直接发送到你的钱包</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}