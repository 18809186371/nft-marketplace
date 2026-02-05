'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import { Header } from '@/components/Header'
import { useWeb3 } from '@/components/Web3Provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-toastify'
import { mintSchema } from './schema'
import { mintNFT } from './action'
import type { MintFormData } from './types'

export default function MintPage() {
  const { isConnected, address } = useWeb3()
  const [isMinting, setIsMinting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<MintFormData>({
    resolver: zodResolver(mintSchema),
    defaultValues: {
      name: '',
      description: '',
      image: null,
      attributes: []
    }
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('image', file, { shouldValidate: true })
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (data: MintFormData) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsMinting(true)
    
    try {
      const result = await mintNFT(data, address, (progress) => {
        console.log('Progress:', progress)
      })

      if (result.success) {
        toast.success(`NFT minted successfully! Token ID: ${result.tokenId}`)
        
        // 重置表单
        setValue('name', '')
        setValue('description', '')
        setValue('image', null)
        setImagePreview(null)
      } else {
        toast.error(result.error || 'Failed to mint NFT')
      }
    } catch (error: any) {
      console.error('Mint error:', error)
      toast.error(error.message || 'Failed to mint NFT')
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New NFT</h1>
            <p className="text-gray-600">Mint a unique digital asset on the blockchain</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左侧表单 */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>NFT Details</CardTitle>
                    <CardDescription>Basic information about your NFT</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 图片上传 */}
                    <div className="space-y-2">
                      <Label htmlFor="image">NFT Image *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                           onClick={() => document.getElementById('image')?.click()}>
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="py-6">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">Click to upload image</p>
                            <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        )}
                      </div>
                      {errors.image && (
                        <p className="text-sm text-red-500">{errors.image.message}</p>
                      )}
                    </div>

                    {/* 名称 */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="My Awesome NFT"
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    {/* 描述 */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your NFT..."
                        rows={4}
                        {...register('description')}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-500">{errors.description.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右侧预览和操作 */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        {watch('name') || 'Untitled NFT'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {watch('description') || 'No description'}
                      </p>
                      <div className="pt-4 border-t">
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Network: Hardhat Local</p>
                          <p>Mint Fee: Free</p>
                          <p>Storage: IPFS</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mint NFT</CardTitle>
                    <CardDescription>Complete the minting process</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="submit"
                      className="w-full py-6 text-lg"
                      disabled={isMinting || !isConnected}
                    >
                      {isMinting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Minting...
                        </>
                      ) : !isConnected ? (
                        'Connect Wallet to Mint'
                      ) : (
                        'Mint NFT'
                      )}
                    </Button>
                    
                    {!isConnected && (
                      <p className="text-sm text-gray-500 text-center mt-3">
                        Please connect your wallet to mint NFTs
                      </p>
                    )}

                    {isConnected && (
                      <div className="mt-4 text-sm text-gray-600 space-y-2">
                        <p>Connected: {address?.slice(0, 10)}...{address?.slice(-8)}</p>
                        <p className="text-xs text-gray-500">
                          By clicking &quot;Mint NFT&quot;, you&apos;ll create a unique token on the blockchain.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}