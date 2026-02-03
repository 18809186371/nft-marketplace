'use client'
import { Header } from '@/components/Header'
import { useWeb3 } from '@/components/Web3Provider'
import { useState } from 'react'
import { toast } from 'react-toastify'
import NFT_ABI from '@/contracts/abi/SimpleNFT.json'

// 你的合约地址
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string

export default function MintPage() {
  const { isConnected, address, getContract } = useWeb3()
  const [isMinting, setIsMinting] = useState(false)

  const handleMint = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    const nftContract = getContract(NFT_CONTRACT_ADDRESS, NFT_ABI.abi)
    if (!nftContract) {
      toast.error('Contract not loaded')
      return
    }

    setIsMinting(true)
    try {
      // 使用 ethers.js 发送交易
      const tx = await nftContract.mint(address)
      toast.info(`Transaction sent: ${tx.hash}`)

      // 等待交易确认（1个区块确认）
      const receipt = await tx.wait()
      if (receipt && receipt.status === 1) {
        toast.success('NFT Minted Successfully!')
      } else {
        toast.error('Mint transaction failed')
      }
    } catch (error: any) {
      console.error('Mint error:', error)
      // 提供更友好的错误信息
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction was rejected by user')
      } else if (error.reason) {
        toast.error(`Mint failed: ${error.reason}`)
      } else {
        toast.error(`Mint failed: ${error.message?.split('(')[0]}`)
      }
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Create NFT (ethers.js)</h1>
        <p className="text-gray-600 mb-8">Using ethers.js for contract interaction</p>

        <div className="bg-white border rounded-xl p-8 shadow-sm">
          {/* ... UI部分与之前类似，可复用 ... */}
          <button
            onClick={handleMint}
            disabled={isMinting || !isConnected}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {!isConnected ? 'Connect Wallet to Mint' :
              isMinting ? 'Minting...' : 'Mint NFT with ethers.js'}
          </button>
        </div>
      </div>
    </main>
  )
}