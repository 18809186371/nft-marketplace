'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import CopyButton from '@/components/ui/CopyButton'
import Image from 'next/image'
import {
  Heart, Share2, AlertCircle,
  User, Tag, Globe, Clock,
  Shield, CheckCircle
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { formatEther, ethers } from 'ethers'
import { Alchemy, Network } from 'alchemy-sdk'
import SimpleNFT_ABI from '../../../../artifacts/contracts/SimpleNFT.sol/SimpleNFT.json'
import Marketplace_ABI from '../../../../artifacts/contracts/NFTMarketPlace.sol/NFTMarketPlace.json'

// 环境变量
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS as string
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string

// 初始化 Alchemy
const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
})

export default function AssetDetailPage() {
  const params = useParams()
  const tokenId = params.tokenId as string

  const [nft, setNft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (tokenId) {
      loadNFTDetail()
    }
  }, [tokenId])

  const loadNFTDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, SimpleNFT_ABI.abi, provider)
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, Marketplace_ABI.abi, provider)

      // 1. 获取 tokenURI
      let tokenURI = ''
      try {
        tokenURI = await nftContract.tokenURI(tokenId)
      } catch (err) {
        console.warn('tokenURI 获取失败，可能不存在')
      }

      // 2. 获取元数据（优先使用 Alchemy，否则手动解析）
      let metadata: any = {}
      let image = ''
      let name = `NFT #${tokenId}`
      let description = ''

      if (tokenURI) {
        // 尝试从 Alchemy 获取元数据
        try {
          const nftMetadata = await alchemy.nft.getNftMetadata(NFT_CONTRACT_ADDRESS, Number(tokenId))

          console.log('nftMetadata', nftMetadata);
          metadata = nftMetadata.raw.metadata || {}
          name = metadata.name || name
          description = metadata.description || ''
          image = nftMetadata.image?.original || nftMetadata.image?.cachedUrl || ''
        } catch (err) {
          console.warn('Alchemy 获取元数据失败，尝试手动获取', err)
          // 手动获取 IPFS 元数据
          if (tokenURI.startsWith('ipfs://')) {
            const cid = tokenURI.replace('ipfs://', '')
            const gatewayUrl = `https://ipfs.filebase.io/ipfs/${cid}`
            try {
              const res = await fetch(gatewayUrl)
              const json = await res.json()
              metadata = json
              name = json.name || name
              description = json.description || ''
              image = json.image || ''
            } catch (fetchErr) {
              console.error('手动获取元数据失败', fetchErr)
            }
          }
        }
      }

      // 处理图片 IPFS
      if (image.startsWith('ipfs://')) {
        image = `https://ipfs.filebase.io/ipfs/${image.replace('ipfs://', '')}`
      }

      // 3. 获取当前所有者
      let owner = ''
      try {
        owner = await nftContract.ownerOf(tokenId)
      } catch (err) {
        console.error('获取 owner 失败', err)
      }

      // 4. 获取上架信息
      let isListed = false
      let price = '0'
      let seller = owner
      try {
        const listing = await marketplace.getListing(NFT_CONTRACT_ADDRESS, tokenId)
        isListed = listing.isActive
        if (isListed) {
          price = listing.price.toString()
          seller = listing.seller
        }
      } catch (err) {
        // 未上架，忽略
      }

      // 5. 组装 NFT 详情对象（与 mock 结构保持一致）
      const nftDetail = {
        id: Number(tokenId),
        tokenId: Number(tokenId),
        name,
        description,
        image,
        price,
        seller,
        owner,
        contractAddress: NFT_CONTRACT_ADDRESS,
        isListed,
        // 属性可以从 metadata.attributes 获取
        attributes: metadata.attributes || [
          { trait_type: '稀有度', value: '未知', rarity: '-' },
        ],
        // 历史事件暂时留空或从事件获取（可选）
        history: [],
      }
      console.log('nftDetail', nftDetail);
      setNft(nftDetail)
    } catch (err: any) {
      console.error('加载NFT详情失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async () => {
    if (!nft || !nft.isListed) return
    console.log('购买NFT:', nft)
    // 1. 连接钱包
    if (!window.ethereum) {
      alert('请先安装 MetaMask')
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, Marketplace_ABI.abi, signer)
      const priceWei = nft.price
      const tx = await marketplace.buyItem(NFT_CONTRACT_ADDRESS, nft.tokenId, { value: priceWei })
      await tx.wait()
      alert('购买成功！')
      // 重新加载详情以更新状态
      loadNFTDetail()
    } catch (err: any) {
      console.error('购买失败:', err)
      alert('购买失败：' + (err.message || '未知错误'))
    }
  }

  const handleMakeOffer = () => {
    alert('出价功能暂未实现')
  }

  if (loading) {
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

  if (error || !nft) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">加载失败</h2>
          <p className="text-gray-600 mb-6">{error || 'NFT不存在'}</p>
          <Button onClick={() => window.history.back()}>返回</Button>
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
          <span className="hover:text-purple-600 cursor-pointer" onClick={() => window.history.back()}>市场</span>
          <span className="mx-2">/</span>
          <span className="hover:text-purple-600 cursor-pointer">收藏品</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{nft.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左侧：NFT图片 */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl">
              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  暂无图片
                </div>
              )}
              <button
                className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* 属性标签 */}
            {nft.attributes && nft.attributes.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4">属性</h3>
                <div className="grid grid-cols-2 gap-3">
                  {nft.attributes.map((attr: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">{attr.trait_type}</div>
                      <div className="font-bold mb-1">{attr.value}</div>
                      {attr.rarity && <div className="text-xs text-purple-600">{attr.rarity} 拥有</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    {nft.owner ? `${nft.owner.slice(0, 8)}...${nft.owner.slice(-6)}` : '未知'}
                  </span>
                  {nft.owner && <CopyButton text={nft.owner} />}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="h-4 w-4" />
                  <span>以太坊</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-8">
                {nft.description || '暂无描述'}
              </p>
            </div>

            {/* 价格和购买区域 */}
            {nft.isListed ? (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-gray-600 mb-1">当前价格</div>
                    <div className="text-5xl font-bold">
                      {formatEther(nft.price)} ETH
                    </div>
                    <div className="text-gray-600 mt-2">≈ ${(Number(formatEther(nft.price)) * 2000).toFixed(2)} USD</div>
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
                      <span className="font-mono">{nft.seller.slice(0, 10)}...{nft.seller.slice(-8)}</span>
                      <CopyButton text={nft.seller} />
                    </div>
                    <div className="flex justify-between">
                      <span>合约地址</span>
                      <span className="font-mono">{nft.contractAddress.slice(0, 12)}...{nft.contractAddress.slice(-10)}</span>
                      <CopyButton text={nft.contractAddress} />
                    </div>
                    <div className="flex justify-between">
                      <span>Token ID</span>
                      <span className="font-mono">#{nft.tokenId}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-bold mb-2">当前未在售</h3>
                <p className="text-gray-600 mb-4">此 NFT 目前没有上架出售</p>
                {nft.owner && (
                  <Button variant="outline" onClick={() => alert('上架功能请到个人页面操作')}>
                    上架此 NFT
                  </Button>
                )}
              </div>
            )}

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
                  <span className="font-medium">{nft.isListed ? '当前在售' : '未上架'}</span>
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