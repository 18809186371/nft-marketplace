'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import SimpleNFT_ABI from '@/abis/SimpleNFT.json'
import Marketplace_ABI from '@/abis/NFTMarketPlace.json'

interface ListNFTModalProps {
  nft: {
    tokenId: number
    contractAddress: string
    name: string
    image: string
  }
  marketplaceAddress: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ListNFTModal({ nft, marketplaceAddress, isOpen, onClose, onSuccess }: ListNFTModalProps) {
  const [price, setPrice] = useState('')
  const [step, setStep] = useState<'checking' | 'approve' | 'listing' | 'completed'>('checking')
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setPrice('')
      setStep('checking')
      setError('')
      setTxHash('')
      setIsProcessing(false)
    }
  }, [isOpen])

  // 执行授权检查
  useEffect(() => {
    if (!isOpen) return

    const performCheck = async () => {
      if (step !== 'checking') return
      setError('')
      try {
        if (!window.ethereum) throw new Error('请先连接钱包')
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        await checkApproval(signer)
      } catch (err: any) {
        console.error('授权检查失败:', err)
        setError(err.message || '检查授权状态时出错，请重试')
      }
    }

    performCheck()
  }, [isOpen, step])

  const checkApproval = async (signer: ethers.Signer) => {
    const nftContract = new ethers.Contract(nft.contractAddress, SimpleNFT_ABI.abi, signer)
    const approvedAddress = await nftContract.getApproved(nft.tokenId)
    const isApproved = approvedAddress.toLowerCase() === marketplaceAddress.toLowerCase()
    if (isApproved) {
      setStep('listing')
    } else {
      // 检查是否是所有授权
      const isApprovedForAll = await nftContract.isApprovedForAll(await signer.getAddress(), marketplaceAddress)
      if (isApprovedForAll) {
        setStep('listing')
      } else {
        setStep('approve')
      }
    }
  }

  const handleApprove = async () => {
    if (!window.ethereum) return
    setIsProcessing(true)
    setError('')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const nftContract = new ethers.Contract(nft.contractAddress, SimpleNFT_ABI.abi, signer)
      
      const tx = await nftContract.approve(marketplaceAddress, nft.tokenId)
      setTxHash(tx.hash)
      await tx.wait()
      
      setStep('listing')
    } catch (err: any) {
      setError(err.message || '授权失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleList = async () => {
    if (!window.ethereum) return
    if (!price || parseFloat(price) <= 0) {
      setError('请输入有效价格')
      return
    }

    setIsProcessing(true)
    setError('')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const marketplace = new ethers.Contract(marketplaceAddress, Marketplace_ABI.abi, signer)
      
      const priceWei = ethers.parseEther(price)
      const tx = await marketplace.listItem(nft.contractAddress, nft.tokenId, priceWei)
      setTxHash(tx.hash)
      await tx.wait()
      
      setStep('completed')
      onSuccess()
      setTimeout(() => onClose(), 1500)
    } catch (err: any) {
      setError(err.message || '上架失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setStep('checking')
  }

  const renderContent = () => {
    if (step === 'checking') {
      return (
        <div className="py-8 flex flex-col items-center">
          {error ? (
            <>
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={handleRetry} variant="outline">
                重试
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-4 text-gray-600">检查授权状态...</p>
            </>
          )}
        </div>
      )
    }

    if (step === 'approve') {
      return (
        <div className="space-y-6 py-4">
          <Alert>
            <AlertDescription>
              需要先授权市场合约操作您的 NFT，然后才能上架。
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              取消
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              授权
            </Button>
          </div>
        </div>
      )
    }

    if (step === 'listing') {
      return (
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="price">价格 (ETH)</Label>
            <Input
              id="price"
              type="number"
              step="0.001"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="例如 0.05"
              disabled={isProcessing}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              取消
            </Button>
            <Button onClick={handleList} disabled={isProcessing || !price}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              上架
            </Button>
          </div>
        </div>
      )
    }

    if (step === 'completed') {
      return (
        <div className="py-8 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">上架成功！</h3>
          <p className="text-sm text-gray-600 mt-1">您的 NFT 已开始在市场上出售</p>
          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:underline mt-2"
            >
              查看交易
            </a>
          )}
        </div>
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>上架 NFT</DialogTitle>
          <DialogDescription>
            {nft.name} · #{nft.tokenId}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}