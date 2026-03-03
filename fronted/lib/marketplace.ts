import { ethers } from 'ethers';
import { Alchemy, Network, NftMetadataBatchToken } from 'alchemy-sdk';
import Marketplace_ABI from '../../artifacts/contracts/NFTMarketPlace.sol/NFTMarketPlace.json';
import pLimit from 'p-limit';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string;
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS as string;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY as string;

if (!ALCHEMY_API_KEY || !NFT_CONTRACT_ADDRESS || !MARKETPLACE_ADDRESS || !RPC_URL) {
  console.error('❌ 缺失必要的环境变量');
}

const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
});

const provider = new ethers.JsonRpcProvider(RPC_URL);
const marketplaceInterface = new ethers.Interface(Marketplace_ABI.abi);

const getMarketplaceContract = () => {
  return new ethers.Contract(MARKETPLACE_ADDRESS, Marketplace_ABI.abi, provider);
};

const formatIpfsUrl = (url: string | undefined | null) => {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.filebase.io/ipfs/${url.replace('ipfs://', '')}`;
  }
  return url;
};

async function fetchEventsFromEtherscan(): Promise<any[]> {
  if (!ETHERSCAN_API_KEY) return [];
  const topic0 = '0xd547e933094f12a9159076970143ebe73234e64480317844b0dcb36117116de4';
  const url = `https://api.etherscan.io/v2/api?chainid=11155111&module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${MARKETPLACE_ADDRESS}&topic0=${topic0}&apikey=${ETHERSCAN_API_KEY}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    return data.status === '1' ? data.result : [];
  } catch (error) {
    return [];
  }
}

async function fetchEventsFromRPCConcurrent(): Promise<any[]> {
  const marketplace = getMarketplaceContract();
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 5000);
  const batchSize = 1000;
  const limit = pLimit(5);

  const tasks = [];
  for (let start = fromBlock; start <= currentBlock; start += batchSize) {
    const end = Math.min(start + batchSize - 1, currentBlock);
    tasks.push(limit(() => marketplace.queryFilter('ItemListed', start, end)));
  }

  const results = await Promise.all(tasks);
  return results.flat();
}

export async function fetchListedNFTs() {
  let rawLogs = await fetchEventsFromEtherscan();
  const isEtherscanData = rawLogs.length > 0;

  if (!isEtherscanData) {
    rawLogs = await fetchEventsFromRPCConcurrent();
  }

  if (rawLogs.length === 0) return [];

  const latestMap = new Map<string, any>();
  for (const log of rawLogs) {
    try {
      let args, blockNumber;
      if (isEtherscanData) {
        const parsed = marketplaceInterface.parseLog({ topics: log.topics, data: log.data });
        if (!parsed) continue;
        args = parsed.args;
        blockNumber = parseInt(log.blockNumber, 16);
      } else {
        args = (log as ethers.EventLog).args;
        blockNumber = log.blockNumber;
      }

      const { nftContract, tokenId, seller, price } = args;
      const key = `${nftContract}-${tokenId.toString()}`.toLowerCase();

      if (!latestMap.has(key) || blockNumber > latestMap.get(key).blockNumber) {
        latestMap.set(key, { seller, nftContract, tokenId: tokenId.toString(), price: price.toString(), blockNumber });
      }
    } catch (e) { continue; }
  }

  const marketplace = getMarketplaceContract();
  const validationLimit = pLimit(10);
  const activeListings = (await Promise.all(
    Array.from(latestMap.values()).map(event =>
      validationLimit(async () => {
        try {
          const listing = await marketplace.getListing(event.nftContract, event.tokenId);
          return listing.isActive ? { ...event, seller: listing.seller, price: listing.price.toString() } : null;
        } catch (e) { return null; }
      })
    )
  )).filter(Boolean);

  if (activeListings.length === 0) return [];

  try {
    const tokens: NftMetadataBatchToken[] = activeListings.map(item => ({
      contractAddress: item.nftContract,
      tokenId: item.tokenId,
    }));

    const response = await alchemy.nft.getNftMetadataBatch(tokens);
    const metadataList = response.nfts;

    return activeListings.map((listing, index) => {
      const meta = metadataList[index];
      const raw = meta?.rawMetadata || {};
      
      const imageUrl = 
        meta?.image?.original || 
        meta?.image?.cachedUrl || 
        meta?.image?.thumbnailUrl || 
        raw.image || 
        '';

      return {
        id: listing.tokenId,
        tokenId: listing.tokenId,
        name: meta?.name || raw.name || `NFT #${listing.tokenId}`,
        description: meta?.description || raw.description || '',
        image: formatIpfsUrl(imageUrl),
        price: listing.price,
        seller: listing.seller,
        contractAddress: listing.nftContract,
        isListed: true,
      };
    });
  } catch (error) {
    console.error('Batch metadata fetch failed:', error);
    return [];
  }
}