'use client'
import { useState } from 'react'
import { Header } from '@/components/Header'
import { 
  User, Package, ShoppingBag, CreditCard,
  Settings, LogOut, PlusCircle, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
// import ListNFTModal from '@/components/marketplace/ListNFTModal'
import NFTCard from '@/components/marketplace/NFTCard'

// 模拟数据
const mockOwnedNFTs = [
  {
    id: 1,
    tokenId: 1,
    name: 'My First NFT',
    description: 'The first NFT I ever created',
    image: 'https://picsum.photos/seed/profile1/400/400',
    price: '0',
    seller: '我的地址',
    contractAddress: '0x...',
    isListed: false
  },
  // 更多NFT...
]

const mockListedNFTs = [
  {
    id: 2,
    tokenId: 2,
    name: 'Digital Art #1',
    description: 'My digital artwork listed for sale',
    image: 'https://picsum.photos/seed/profile2/400/400',
    price: '50000000000000000', // 0.05 ETH
    seller: '我的地址',
    contractAddress: '0x...',
    isListed: true
  },
  // 更多NFT...
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'owned' | 'listed' | 'activity'>('owned')
  const [showListModal, setShowListModal] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<any>(null)

  const handleListNFT = (nft: any) => {
    setSelectedNFT(nft)
    setShowListModal(true)
  }

  const handleListSuccess = () => {
    setShowListModal(false)
    // 刷新NFT列表
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      {/* {showListModal && (
        <ListNFTModal
          nft={selectedNFT}
          onClose={() => setShowListModal(false)}
          onSuccess={handleListSuccess}
        />
      )} */}

      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-900 to-pink-800 rounded-3xl p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center">
                <User className="h-16 w-16" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-purple-900"></div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold">NFT收藏家</h1>
                <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  高级会员
                </div>
              </div>
              <p className="text-purple-200 mb-6">
                专注于数字艺术收藏，已收集 24 个独特NFT
              </p>
              
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-purple-300 text-sm">拥有的NFT</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">5</div>
                  <div className="text-purple-300 text-sm">正在出售</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">2.4 ETH</div>
                  <div className="text-purple-300 text-sm">总价值</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-purple-300 text-sm">交易次数</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-4 font-medium flex items-center gap-2 ${
                activeTab === 'owned'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('owned')}
            >
              <Package className="h-5 w-5" />
              我的藏品
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full ml-2">
                12
              </span>
            </button>
            <button
              className={`px-6 py-4 font-medium flex items-center gap-2 ${
                activeTab === 'listed'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('listed')}
            >
              <ShoppingBag className="h-5 w-5" />
              正在出售
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full ml-2">
                5
              </span>
            </button>
            <button
              className={`px-6 py-4 font-medium flex items-center gap-2 ${
                activeTab === 'activity'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              <CreditCard className="h-5 w-5" />
              交易记录
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="space-y-8">
          {activeTab === 'owned' && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">我的NFT藏品</h2>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    筛选
                  </Button>
                  <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600">
                    <PlusCircle className="h-4 w-4" />
                    铸造新NFT
                  </Button>
                </div>
              </div>
              
              {mockOwnedNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mockOwnedNFTs.map((nft) => (
                    <div key={nft.id} className="relative group">
                      <NFTCard nft={nft} showActions={false} />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                        <Button 
                          className="bg-white text-gray-900 hover:bg-gray-100"
                          onClick={() => handleListNFT(nft)}
                        >
                          上架出售
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <div className="text-5xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold mb-2">暂无NFT藏品</h3>
                  <p className="text-gray-600 mb-6">开始铸造或购买你的第一个NFT吧！</p>
                  <div className="flex justify-center gap-4">
                    <Button>去铸造</Button>
                    <Button variant="outline">探索市场</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'listed' && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">正在出售的NFT</h2>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  筛选
                </Button>
              </div>
              
              {mockListedNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mockListedNFTs.map((nft) => (
                    <NFTCard key={nft.id} nft={nft} showActions={true} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl">
                  <div className="text-5xl mb-4">🏷️</div>
                  <h3 className="text-xl font-semibold mb-2">暂无在售NFT</h3>
                  <p className="text-gray-600 mb-6">从你的藏品中选择NFT上架出售</p>
                  <Button onClick={() => setActiveTab('owned')}>查看我的藏品</Button>
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6">交易记录</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">购买成功</div>
                      <div className="text-sm text-gray-600">Crypto Punk #9999</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">-0.1 ETH</div>
                    <div className="text-sm text-gray-600">2小时前</div>
                  </div>
                </div>
                {/* 更多交易记录... */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}