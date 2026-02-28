'use client'
import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import {
  User, Package, ShoppingBag, CreditCard,
  Settings, LogOut, PlusCircle, Filter, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import NFTCard from '@/components/marketplace/NFTCard'
import { Alchemy, Network } from 'alchemy-sdk'
import { ethers } from 'ethers'
import ListNFTModal from '@/components/marketplace/ListNFTModal'
import SimpleNFT_ABI from '../../../artifacts/contracts/SimpleNFT.sol/SimpleNFT.json'
import Marketplace_ABI from '../../../artifacts/contracts/NFTMarketPlace.sol/NFTMarketPlace.json'

// 环境变量
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string
const NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS as string
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string

// 初始化 Alchemy（指定 Sepolia 网络）
const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
})

// 定义 NFT 类型（与 NFTCard 的 props 完全匹配）
interface NFTItem {
  id: number           // 对应 tokenId
  tokenId: number
  name: string
  description: string
  image: string
  price: string        // wei 格式，未上架时为 '0'
  seller: string       // 当前所有者地址
  contractAddress: string
  isListed: boolean
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'owned' | 'listed' | 'activity'>('owned')
  const [ownedNFTs, setOwnedNFTs] = useState<NFTItem[]>([])
  const [listedNFTs, setListedNFTs] = useState<NFTItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [account, setAccount] = useState<string>('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [showListModal, setShowListModal] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)

  // 获取当前钱包账户
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) setAccount(accounts[0])
      })
      // 监听账户变化
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || '')
      })
    }
  }, [])

  // 当账户变化时重新获取数据
  useEffect(() => {
    if (account) fetchUserNFTs(account)
    else {
      setOwnedNFTs([])
      setListedNFTs([])
    }
  }, [account])

  const fetchUserNFTs = async (owner: string) => {
    if (!owner || !NFT_CONTRACT_ADDRESS || !NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS) return
    setIsLoading(true)
    try {
      // 1. 从 Alchemy 获取该地址在 SimpleNFT 合约中拥有的所有 NFT
      const response = await alchemy.nft.getNftsForOwner(owner, {
        contractAddresses: [NFT_CONTRACT_ADDRESS],
      })
      if (response.ownedNfts.length === 0) {
        setOwnedNFTs([])
        setListedNFTs([])
        return
      }

      // 2. 初始化 provider 和市场合约实例
      const provider = new ethers.BrowserProvider(window.ethereum)
      const marketplaceContract = new ethers.Contract(NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS, Marketplace_ABI.abi, provider)

      // 3. 并发处理每个 NFT，获取上架状态和价格
      const nftPromises = response.ownedNfts.map(async (nft) => {
        const tokenId = nft.tokenId // 十进制字符串
        const tokenIdNumber = Number(tokenId)

        // 查询市场合约中的 listing
        let isListed = false
        let price = '0' // 默认为 0
        try {
          const listing = await marketplaceContract.getListing(NFT_CONTRACT_ADDRESS, tokenId)
          isListed = listing.isActive
          if (isListed) {
            price = listing.price.toString() // bigint -> string
          }
        } catch (e) {
          // 未上架或查询失败，忽略
        }

        // 从 Alchemy 返回的 metadata 中提取信息
        const name = nft.metadata?.name || `NFT #${tokenId}`
        const description = nft.metadata?.description || ''
        // 将 IPFS URI 转换为 HTTP 网关链接
        let image = nft.metadata?.image || nft.image?.cachedUrl || ''
        if (image.startsWith('ipfs://')) {
          image = `https://ipfs.io/ipfs/${image.replace('ipfs://', '')}`
        }

        return {
          id: tokenIdNumber,
          tokenId: tokenIdNumber,
          name,
          description,
          image,
          price,
          seller: owner, // 当前所有者就是自己
          contractAddress: NFT_CONTRACT_ADDRESS,
          isListed,
        }
      })

      const allNFTs = await Promise.all(nftPromises)
      setOwnedNFTs(allNFTs)
      console.log('allNFTs', allNFTs)
      setListedNFTs(allNFTs.filter(nft => nft.isListed))
    } catch (error) {
      console.error('获取 NFT 失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelListing = async (nft: NFTItem) => {
    if (!window.ethereum) return
    setIsCancelling(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const marketplace = new ethers.Contract(NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS, Marketplace_ABI.abi, signer)

      const tx = await marketplace.cancelListing(NFT_CONTRACT_ADDRESS, nft.tokenId)
      await tx.wait()

      // 刷新列表
      await fetchUserNFTs(account)
    } catch (error: any) {
      console.error('取消上架失败:', error)
      alert('取消上架失败：' + (error.message || '未知错误'))
    } finally {
      setIsCancelling(false)
    }
  }

  const handleListNFT = (nft: NFTItem) => {
    setSelectedNFT(nft)
    setShowListModal(true)
  }

  const handleListSuccess = () => {
    setShowListModal(false)
    if (account) fetchUserNFTs(account) // 刷新列表
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      {/* 上架模态框（暂未实现） */}
      {/* {showListModal && selectedNFT && (
        <ListNFTModal
          nft={selectedNFT}
          onClose={() => setShowListModal(false)}
          onSuccess={handleListSuccess}
        />
      )} */}

      <div className="container mx-auto px-4 py-8">
        {/* 个人资料卡片 */}
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
                {/* <div className="px-3 py-1 bg-white/20 rounded-full text-sm">高级会员</div> */}
              </div>
              <p className="text-purple-200 mb-6">
                {account ? `钱包地址: ${account.slice(0, 6)}...${account.slice(-4)}` : '未连接钱包'}
              </p>

              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-2xl font-bold">{ownedNFTs.length}</div>
                  <div className="text-purple-300 text-sm">拥有的NFT</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{listedNFTs.length}</div>
                  <div className="text-purple-300 text-sm">正在出售</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-purple-300 text-sm">总价值</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">-</div>
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
              className={`px-6 py-4 font-medium flex items-center gap-2 ${activeTab === 'owned'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
              onClick={() => setActiveTab('owned')}
            >
              <Package className="h-5 w-5" />
              我的藏品
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full ml-2">
                {ownedNFTs.length}
              </span>
            </button>
            <button
              className={`px-6 py-4 font-medium flex items-center gap-2 ${activeTab === 'listed'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
              onClick={() => setActiveTab('listed')}
            >
              <ShoppingBag className="h-5 w-5" />
              正在出售
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full ml-2">
                {listedNFTs.length}
              </span>
            </button>
            <button
              className={`px-6 py-4 font-medium flex items-center gap-2 ${activeTab === 'activity'
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

              {isLoading ? (
                <div className="text-center py-20">加载中...</div>
              ) : ownedNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {ownedNFTs.map((nft) => (
                    <div key={nft.id} className="relative group">
                      {/* 仅展示，不显示操作按钮 */}
                      <NFTCard nft={nft} showActions={false} />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                        {nft.isListed ? (
                          <Button
                            className="bg-white text-gray-900 hover:bg-gray-100"
                            onClick={() => handleCancelListing(nft)}
                            disabled={isCancelling}
                          >
                            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            取消上架
                          </Button>
                        ) : (
                          <Button
                            className="bg-white text-gray-900 hover:bg-gray-100"
                            onClick={() => handleListNFT(nft)}
                          >
                            上架出售
                          </Button>
                        )}
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

              {isLoading ? (
                <div className="text-center py-20">加载中...</div>
              ) : listedNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listedNFTs.map((nft) => (
                    // 对于已上架的 NFT，仍然只展示，不显示购买按钮（暂时）
                    <NFTCard key={nft.id} nft={nft} showActions={false} />
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
                {/* 交易记录可从合约事件获取，暂用 mock */}
              </div>
            </div>
          )}
        </div>

        {showListModal && selectedNFT && (
          <ListNFTModal
            nft={selectedNFT}
            marketplaceAddress={NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS}
            isOpen={showListModal}
            onClose={() => setShowListModal(false)}
            onSuccess={handleListSuccess}
          />
        )}

      </div>
    </div>
  )
}