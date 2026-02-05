import NFTList from '@/components/marketplace/NFTList'
import { Header } from '@/components/Header'
import { TrendingUp, Users, Gem, Zap } from 'lucide-react'

export default function MarketplacePage() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-purple-800 to-pink-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              发现独一无二的
              <span className="block bg-gradient-to-r from-pink-400 to-yellow-300 bg-clip-text text-transparent">
                数字藏品
              </span>
            </h1>
            <p className="text-xl text-purple-100 mb-10">
              探索、收藏和交易来自全球创作者的独家NFT。
              从艺术、音乐到虚拟资产，开启你的数字收藏之旅。
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-white text-purple-900 font-bold rounded-xl hover:bg-gray-100 transition shadow-lg">
                开始探索
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition">
                如何购买？
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">精选藏品</h2>
            <p className="text-gray-600">发现最受欢迎和最新的数字藏品</p>
          </div>
          <div className="hidden md:flex gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option>所有类别</option>
              <option>艺术品</option>
              <option>收藏品</option>
              <option>虚拟土地</option>
              <option>游戏资产</option>
            </select>
          </div>
        </div>

        {/* NFT列表 */}
        <NFTList />

        {/* 特色板块 */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8 text-center">为什么选择我们？</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-3">安全可靠</h3>
              <p className="text-gray-700">
                基于以太坊区块链，每笔交易都公开透明、不可篡改。
                智能合约经过严格审计，保障资产安全。
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-8">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold mb-3">低手续费</h3>
              <p className="text-gray-700">
                相比传统市场，我们提供极具竞争力的交易手续费。
                让创作者和收藏者都能获得更多收益。
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-teal-100 rounded-2xl p-8">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-3">极速交易</h3>
              <p className="text-gray-700">
                基于Layer 2解决方案，实现秒级交易确认。
                告别漫长等待，享受流畅的交易体验。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}