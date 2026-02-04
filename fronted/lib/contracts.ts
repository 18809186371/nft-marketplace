import { Contract } from 'ethers';
import NFT_ABI from '../../artifacts/contracts/SimpleNFT.sol/SimpleNFT.json';
import MARKET_ABI from '../../artifacts/contracts/NFTMarketPlace.sol/NFTMarketPlace.json';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as string
const MARKET_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS as string

// 这是一个简单的工厂函数，实际使用时，结合 useWeb3() 中的 getContract
export const getNFTContract = (signerOrProvider: any): Contract => {
  return new Contract(NFT_ADDRESS, NFT_ABI.abi, signerOrProvider)
}

export const getMarketContract = (signerOrProvider: any): Contract => {
  return new Contract(MARKET_ADDRESS, MARKET_ABI.abi, signerOrProvider)
}

// 只读合约实例（用于未连接钱包时读取数据）
import { JsonRpcProvider } from 'ethers'
const defaultProvider = new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
export const readOnlyNFTContract = getNFTContract(defaultProvider)
export const readOnlyMarketContract = getMarketContract(defaultProvider)