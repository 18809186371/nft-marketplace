'use client'
import { useState, useEffect } from 'react'
import NFTCard from './NFTCard'
import { Loader2, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// import { fetchListedNFTs } from '@/lib/marketplace'

// 模拟数据（实际应从合约获取）
const mockNFTs = [
  {
    id: 1,
    tokenId: 1,
    name: 'Crypto Punk #9999',
    description: 'A rare CryptoPunk with unique attributes and historical significance.',
    image: 'https://picsum.photos/seed/nft1/400/400',
    price: '100000000000000000', // 0.1 ETH in wei
    seller: '0x742d35Cc6634C0532925a3b844Bc9e100E090b0C',
    contractAddress: '0x...',
    isListed: true
  },
  // 添加更多模拟数据...
]

export default function NFTList() {
  const [nfts, setNfts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'newest'>('newest')

  useEffect(() => {
    loadNFTs()
  }, [])

  const loadNFTs = async () => {
    setLoading(true)
    try {
      // 实际应从合约获取数据
      // const listedNFTs = await fetchListedNFTs()
      // setNfts(listedNFTs)
      
      // 暂时使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000))
      setNfts(mockNFTs)
    } catch (error) {
      console.error('加载NFT失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNFTs = nfts.filter(nft =>
    nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'price') {
      return BigInt(a.price) > BigInt(b.price) ? 1 : -1
    }
    return b.id - a.id
  })

  const handleBuyClick = (nft: any) => {
    // 实际购买逻辑
    console.log('购买NFT:', nft)
    // 这里会调用合约的 buyItem 函数
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <span className="ml-3 text-gray-600">加载NFT市场中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索 NFT 名称或描述..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              onClick={() => setSortBy('newest')}
              className="flex-1 md:flex-none"
            >
              最新
            </Button>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              onClick={() => setSortBy('price')}
              className="flex-1 md:flex-none"
            >
              价格
            </Button>
            <Button variant="outline" className="hidden md:flex">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </div>
      </div>

      {/* NFT网格 */}
      {filteredNFTs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => (
            <NFTCard
              key={nft.tokenId}
              nft={nft}
              onBuyClick={handleBuyClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl">
          <div className="text-5xl mb-4">🛍️</div>
          <h3 className="text-xl font-semibold mb-2">暂无NFT在售</h3>
          <p className="text-gray-600 mb-6">成为第一个上架NFT的用户吧！</p>
          <Button>去铸造NFT</Button>
        </div>
      )}

      {/* 分页 */}
      {filteredNFTs.length > 0 && (
        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" disabled>上一页</Button>
          <Button variant="default">1</Button>
          <Button variant="outline">2</Button>
          <Button variant="outline">3</Button>
          <span className="mx-2">...</span>
          <Button variant="outline">10</Button>
          <Button variant="outline">下一页</Button>
        </div>
      )}
    </div>
  )
}