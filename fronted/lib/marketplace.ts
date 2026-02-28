import { ethers } from 'ethers';
import { Alchemy, Network } from 'alchemy-sdk';
import Marketplace_ABI from '../../artifacts/contracts/NFTMarketPlace.sol/NFTMarketPlace.json';
import pLimit from 'p-limit'; // 添加导入

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY as string;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as string;
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS as string;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY as string;

if (!ALCHEMY_API_KEY) throw new Error('Missing NEXT_PUBLIC_ALCHEMY_API_KEY');
if (!NFT_CONTRACT_ADDRESS) throw new Error('Missing NEXT_PUBLIC_NFT_CONTRACT_ADDRESS');
if (!MARKETPLACE_ADDRESS) throw new Error('Missing NEXT_PUBLIC_MARKETPLACE_ADDRESS');
if (!RPC_URL) throw new Error('Missing NEXT_PUBLIC_RPC_URL');
if (!ETHERSCAN_API_KEY) {
  console.warn(
    '⚠️ 未设置 NEXT_PUBLIC_ETHERSCAN_API_KEY，将使用 RPC 回退方案（速度较慢且受区块范围限制）。\n' +
    '建议从 https://etherscan.io/myapikey 获取并配置。'
  );
}

// 初始化 Alchemy
const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
});

async function fetchEventsFromEtherscan(): Promise<any[]> {
  if (!ETHERSCAN_API_KEY) return [];

  const url = `https://api.etherscan.io/v2/api?chainid=11155111&module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${MARKETPLACE_ADDRESS}&topic0=0xd547e933094f12a9159076970143ebe73234e64480317844b0dcb36117116de4&apikey=${ETHERSCAN_API_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.status !== '1') {
      console.warn('Etherscan API 返回错误:', data.message, '完整响应:', data);
      return [];
    }

    return data.result;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Etherscan API 请求超时（10秒）');
    } else {
      console.error('Etherscan API 请求失败:', error);
    }
    return [];
  }
}


async function fetchEventsFromRPCConcurrent(): Promise<any[]> {
  console.log('使用并发 RPC 查询...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, Marketplace_ABI.abi, provider);

  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 2000); // 范围缩小
  const batchSize = 10;
  const batches = [];
  for (let start = fromBlock; start <= currentBlock; start += batchSize) {
    const end = Math.min(start + batchSize - 1, currentBlock);
    batches.push({ start, end });
  }

  const limit = pLimit(5); // 同时最多发起 5 个查询
  const results = await Promise.all(
    batches.map(batch =>
      limit(async () => {
        try {
          const testBlock = 10339302;
          const testEvents = await marketplace.queryFilter('ItemListed', testBlock, testBlock);
          console.log(`精确查询区块 ${testBlock} 结果:`, testEvents.length);
          const events = await marketplace.queryFilter('ItemListed', batch.start, batch.end);
          const eventLogs = events.filter((e): e is ethers.EventLog => 'args' in e);
          return eventLogs;
        } catch (err) {
          console.warn(`查询失败 ${batch.start}-${batch.end}:`, err);
          return [];
        }
      })
    )
  );

  const allEvents = results.flat();
  console.log(`RPC 查询到 ${allEvents.length} 个事件`);

  return allEvents.map(event => ({
    blockNumber: event.blockNumber,
    data: event.data,
    topics: event.topics,
    parsed: ethers.Interface.from(Marketplace_ABI.abi).parseLog(event),
  })).filter(item => item.parsed !== null);
}

export async function fetchListedNFTs() {
  console.log('🔥 fetchListedNFTs 被调用！');
  console.log('=== 开始获取已上架 NFT ===');
  console.log('市场合约地址:', MARKETPLACE_ADDRESS);
  console.log('NFT合约地址:', NFT_CONTRACT_ADDRESS);

  console.time('1. 获取事件日志');
  let logs = await fetchEventsFromEtherscan();
  let usingEtherscan = logs.length > 0;

  if (!usingEtherscan) {
    logs = await fetchEventsFromRPCConcurrent();
    if (logs.length === 0) {
      console.log('未找到任何 ItemListed 事件，函数将返回空数组');
      return [];
    }
  }
  console.timeEnd('1. 获取事件日志');

  console.time('2. 解析去重');
  const latestMap = new Map<string, any>();
  for (const log of logs) {
    let parsed;
    if (usingEtherscan) {
      const iface = new ethers.Interface(Marketplace_ABI.abi);
      parsed = iface.parseLog({
        topics: log.topics,
        data: log.data,
      });
      if (!parsed) continue;
    } else {
      parsed = log.parsed;
    }

    const { seller, nftContract, tokenId, price } = parsed.args;
    const key = `${nftContract}-${tokenId.toString()}`;
    const blockNumber = usingEtherscan ? parseInt(log.blockNumber, 16) : log.blockNumber;
    const existing = latestMap.get(key);

    if (!existing || blockNumber > existing.blockNumber) {
      latestMap.set(key, {
        seller,
        nftContract,
        tokenId: tokenId.toString(),
        price: price.toString(),
        blockNumber,
      });
    }
  }
  console.timeEnd('2. 解析去重');

  console.log(`去重后得到 ${latestMap.size} 个最新上架记录`);

  // 连接到 provider 和市场合约
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, Marketplace_ABI.abi, provider);

  console.time('3. 并发验证活跃状态');
  const limit = pLimit(10); // 限制并发数为 10
  const validationPromises = [];
  for (const [key, event] of latestMap.entries()) {
    validationPromises.push(
      limit(async () => {
        try {
          const listing = await marketplace.getListing(event.nftContract, event.tokenId);
          if (listing.isActive) {
            return {
              tokenId: Number(event.tokenId),
              seller: listing.seller,
              price: listing.price.toString(),
              contractAddress: event.nftContract,
            };
          }
        } catch (e) {
          console.warn(`验证失败: ${key}`, e);
        }
        return null;
      })
    );
  }
  const validationResults = await Promise.all(validationPromises);
  const activeListings = validationResults.filter(Boolean);
  console.timeEnd('3. 并发验证活跃状态');

  console.log(`活跃上架: ${activeListings.length} 个`);

  console.time('4. 并发获取元数据');
  const metadataLimit = pLimit(5);
  const nftPromises = activeListings.map(listing =>
    metadataLimit(async () => {
      try {
        const nftMetadata = await alchemy.nft.getNftMetadata(
          listing?.contractAddress,
          listing?.tokenId
        );
        const metadata = nftMetadata.rawMetadata || {};
        const name = metadata.name || `NFT #${listing?.tokenId}`;
        const description = metadata.description || '';
        let image = nftMetadata.image?.original || nftMetadata.image?.cachedUrl || '';
        if (image.startsWith('ipfs://')) {
          image = `https://ipfs.filebase.io/ipfs/${image.replace('ipfs://', '')}`;
        }

        return {
          id: listing?.tokenId,
          tokenId: listing?.tokenId,
          name,
          description,
          image,
          price: listing?.price,
          seller: listing?.seller,
          contractAddress: listing?.contractAddress,
          isListed: true,
        };
      } catch (err) {
        console.error(`获取元数据失败 tokenId=${listing?.tokenId}`, err);
        return null;
      }
    })
  );

  const nftList = (await Promise.all(nftPromises)).filter(Boolean);
  console.timeEnd('4. 并发获取元数据');

  console.log(`最终返回 ${nftList.length} 个 NFT`);
  return nftList;
}