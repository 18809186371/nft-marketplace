'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers, BrowserProvider, JsonRpcProvider, Contract } from 'ethers';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Web3ContextType {
  provider: BrowserProvider | JsonRpcProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getContract: (address: string, abi: any) => Contract | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// 创建一个变量来缓存实例，避免重复创建
let web3Modal: any;

// 动态导入Web3Modal，仅在客户端执行
const getWeb3Modal = async () => {
  if (typeof window === 'undefined') {
    return null; // 服务端直接返回null
  }
  if (!web3Modal) {
    const Web3Modal = (await import('web3modal')).default;
    web3Modal = new Web3Modal({
      network: 'localhost',
      cacheProvider: true,
      providerOptions: {}, // 可在此配置walletconnect等
    });
  }
  return web3Modal;
};

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // 新增：标记客户端

  // 关键：在useEffect中标记客户端，并初始化只读Provider
  useEffect(() => {
    setIsClient(true); // 组件挂载后，说明已在客户端

    // 初始化一个默认的只读提供者（用于读取数据）
    const defaultProvider = new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    setProvider(defaultProvider);

    // 如果缓存中有provider，则自动连接（用户体验优化）
    const initCachedConnection = async () => {
      const modal = await getWeb3Modal();
      if (modal && modal.cachedProvider) {
        // 短暂延迟，确保DOM就绪
        setTimeout(() => {
          connectWallet();
        }, 500);
      }
    };
    initCachedConnection();
  }, []);

  const connectWallet = async () => {
    // 确保在客户端执行
    if (!isClient) return;

    const modal = await getWeb3Modal();
    if (!modal) {
      toast.error('Web3Modal not available on server');
      return;
    }

    try {
      const instance = await modal.connect();
      const web3Provider = new BrowserProvider(instance);
      const web3Signer = await web3Provider.getSigner();
      const userAddress = await web3Signer.getAddress();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(userAddress);

      // 监听账户变化
      instance.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      // 监听网络变化
      instance.on('chainChanged', () => {
        window.location.reload();
      });

      toast.success('Wallet connected!');
    } catch (error: any) {
      console.error('Connection error:', error);
      // 用户拒绝连接是常见情况，不报错
      if (error.code !== 4001) {
        toast.error(`Failed to connect: ${error.message}`);
      }
    }
  };

  const disconnectWallet = async () => {
    if (!isClient) return;

    const modal = await getWeb3Modal();
    if (modal && modal.cachedProvider) {
      modal.clearCachedProvider();
    }
    // 断开后，恢复为只读Provider
    setProvider(new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL));
    setSigner(null);
    setAddress(null);
    toast.info('Wallet disconnected.');
  };

  const getContract = (address: string, abi: any): Contract | null => {
    if (!provider) return null;
    try {
      const contractSigner = signer || provider;
      return new Contract(address, abi, contractSigner);
    } catch (error) {
      console.error('Error creating contract:', error);
      return null;
    }
  };

  const contextValue: Web3ContextType = {
    provider,
    signer,
    address,
    isConnected: !!address && isClient,
    connectWallet,
    disconnectWallet,
    getContract,
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}