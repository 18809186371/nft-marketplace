'use client'

import { MintFormData } from './types'
import { ethers, ZeroAddress } from 'ethers' // 引入 ZeroAddress
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import NFT_ABI from '@/abis/SimpleNFT.json'

// 环境变量配置
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string
const FILEBASE_ACCESS_KEY = process.env.NEXT_PUBLIC_FILEBASE_ACCESS_KEY as string
const FILEBASE_SECRET_KEY = process.env.NEXT_PUBLIC_FILEBASE_SECRET_KEY as string
const FILEBASE_BUCKET = process.env.NEXT_PUBLIC_FILEBASE_BUCKET as string
const FILEBASE_ENDPOINT = 'https://s3.filebase.com'

function createFilebaseClient() {
  if (!FILEBASE_ACCESS_KEY || !FILEBASE_SECRET_KEY) {
    throw new Error('Filebase 访问密钥未在环境变量中配置')
  }
  return new S3Client({
    region: 'us-east-1',
    endpoint: FILEBASE_ENDPOINT,
    credentials: {
      accessKeyId: FILEBASE_ACCESS_KEY,
      secretAccessKey: FILEBASE_SECRET_KEY,
    },
    forcePathStyle: true,
  })
}

async function uploadToFilebase(file: File | Blob, filePath: string): Promise<string> {
  const s3Client = createFilebaseClient();
  let bodyContent: Uint8Array;
  if (file instanceof File || file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    bodyContent = new Uint8Array(arrayBuffer);
  } else {
    bodyContent = file as Uint8Array;
  }

  // 1. 上传文件
  const putCommand = new PutObjectCommand({
    Bucket: FILEBASE_BUCKET,
    Key: filePath,
    Body: bodyContent,
    ContentType: file instanceof File ? file.type : 'application/json',
  });

  try {
    await s3Client.send(putCommand);

    // 2. 上传成功后，获取对象的元数据（包含 CID）
    const headCommand = new HeadObjectCommand({
      Bucket: FILEBASE_BUCKET,
      Key: filePath,
    });
    const headResponse = await s3Client.send(headCommand);

    // 从元数据中提取 CID（Filebase 会将 CID 放在 Metadata.cid 中）
    // @ts-ignore
    const cid = headResponse.Metadata?.cid;
    if (!cid) {
      console.error('HeadObject 返回的元数据:', headResponse.Metadata);
      throw new Error('无法从 Filebase 获取 CID');
    }

    return `ipfs://${cid}`;
  } catch (error: any) {
    console.error('Filebase 上传或获取CID失败:', error);
    throw new Error(`上传到IPFS失败: ${error.message || '未知错误'}`);
  }
}

export async function mintNFT(
  data: MintFormData,
  recipientAddress: string,
  onProgress?: (progress: any) => void
): Promise<any> {

  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('请先连接钱包（如 MetaMask）')
  }

  if (!FILEBASE_BUCKET) {
    throw new Error('Filebase Bucket 未配置')
  }

  try {
    onProgress?.({ step: 'validate', progress: 10, message: '验证表单数据...' })

    if (!data.image) {
      throw new Error('请上传图片')
    }

    const uploadSessionId = uuidv4().slice(0, 8)

    onProgress?.({ step: 'upload_image', progress: 30, message: '上传图片到IPFS (Filebase)...' })

    const imageExtension = data.image.name.split('.').pop() || 'png'
    const imageFileName = `nft-images/${uploadSessionId}/image.${imageExtension}`
    const imageURI = await uploadToFilebase(data.image, imageFileName)
    const imageCID = imageURI.replace('ipfs://', '')

    onProgress?.({ step: 'upload_metadata', progress: 60, message: '上传元数据到IPFS (Filebase)...' })

    const metadata = {
      name: data.name,
      description: data.description,
      image: imageURI,
      external_url: '',
      attributes: data.attributes || [],
      createdAt: new Date().toISOString(),
      creator: recipientAddress,
    }

    const metadataJson = JSON.stringify(metadata, null, 2)
    const metadataBlob = new Blob([metadataJson], { type: 'application/json' })
    const metadataFileName = `nft-metadata/${uploadSessionId}/metadata.json`
    const tokenURI = await uploadToFilebase(metadataBlob, metadataFileName)
    const metadataCID = tokenURI.replace('ipfs://', '')

    onProgress?.({ step: 'contract', progress: 75, message: '准备合约交互，请确认钱包交易...' })

    const provider = new ethers.BrowserProvider(window.ethereum)
    let signer = await provider.getSigner()
    const network = await provider.getNetwork()

    // ----- 强制使用 Sepolia 测试网 -----
    const SEPOLIA_CHAIN_ID = 11155111n
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        })
        const newProvider = new ethers.BrowserProvider(window.ethereum)
        signer = await newProvider.getSigner()
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          throw new Error('Sepolia 测试网未添加到您的钱包，请手动添加：chainId 11155111')
        } else if (switchError.code === 4001) {
          throw new Error('您拒绝了网络切换，请手动将钱包切换到 Sepolia 测试网后重试')
        } else {
          throw new Error(`网络切换失败: ${switchError.message}`)
        }
      }
    }

    if (!NFT_CONTRACT_ADDRESS || !ethers.isAddress(NFT_CONTRACT_ADDRESS)) {
      throw new Error(`合约地址配置错误: ${NFT_CONTRACT_ADDRESS}`)
    }

    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI.abi, signer)

    onProgress?.({ step: 'transaction', progress: 85, message: '发送交易中，请在钱包中确认...' })

    const tx = await contract.safeMint(recipientAddress, tokenURI)
    console.log('tokenURI', tokenURI)
    onProgress?.({ step: 'waiting', progress: 90, message: '交易已发送，等待区块链确认...' })

    const receipt = await tx.wait()

    // ----- 修复：从 Transfer 事件解析 tokenId -----
    let tokenId = null
    if (receipt.logs && receipt.logs.length > 0) {
      const contractInterface = new ethers.Interface(NFT_ABI.abi)
      for (const log of receipt.logs) {
        // 确保日志来自我们的合约
        if (log.address.toLowerCase() !== NFT_CONTRACT_ADDRESS.toLowerCase()) continue
        try {
          const parsedLog = contractInterface.parseLog(log)
          // 铸造会触发 Transfer 事件，from 为零地址
          if (parsedLog && parsedLog.name === 'Transfer') {
            const from = parsedLog.args[0]
            if (from === ZeroAddress) {
              tokenId = parsedLog.args[2].toString()
              break
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    if (!tokenId) {
      console.warn('无法从交易收据中解析 tokenId，请检查合约事件')
      tokenId = 'unknown' // 备用值，不影响成功流程
    }

    onProgress?.({ step: 'complete', progress: 100, message: 'NFT 铸造成功！' })

    return {
      success: true,
      tokenId,
      transactionHash: receipt.hash,
      tokenURI,
      metadata,
      ipfsLinks: {
        image: `https://ipfs.filebase.io/ipfs/${imageCID}`,
        imageGateway: `https://${imageCID}.ipfs.dweb.link`,
        metadata: `https://ipfs.filebase.io/ipfs/${metadataCID}`,
        metadataGateway: `https://${metadataCID}.ipfs.dweb.link`
      }
    }

  } catch (error: any) {
    console.error('真实铸造过程出错:', error)

    let userFriendlyMessage = '铸造NFT失败'
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      userFriendlyMessage = '您在钱包中拒绝了交易'
    } else if (error.message?.includes('insufficient funds')) {
      userFriendlyMessage = '钱包余额不足，请确保有足够的Sepolia测试网ETH'
    } else if (error.message?.includes('user rejected signing')) {
      userFriendlyMessage = '您拒绝了签名请求'
    } else if (error.message?.includes('Filebase')) {
      userFriendlyMessage = `IPFS上传失败: ${error.message}`
    } else {
      userFriendlyMessage = error.reason || error.message || userFriendlyMessage
    }

    onProgress?.({ step: 'error', progress: 0, message: userFriendlyMessage })

    return {
      success: false,
      error: userFriendlyMessage,
      details: error.message
    }
  }
}

export function getFilePreview(file: File | null): string | null {
  if (!file) return null
  return URL.createObjectURL(file)
}