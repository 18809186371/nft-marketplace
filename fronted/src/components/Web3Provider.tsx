'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers, BrowserProvider, JsonRpcProvider, Contract } from 'ethers';
import Web3Modal from 'web3modal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. 定义Context中要共享的数据和函数类型
interface Web3ContextType {
  provider: BrowserProvider | JsonRpcProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getContract: (address: string, abi: any) => Contract | null;
}

// 2. 创建Context
const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// 3. Web3Modal配置
const web3Modal = new Web3Modal({
  network: 'localhost', // 默认网络，可配置
  cacheProvider: true, // 缓存用户上次选择的钱包
  providerOptions: {}, // 可以配置特定钱包，如WalletConnect
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // 初始化：检查缓存的连接
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    } else {
      // 没有缓存时，创建一个只读的提供者用于读取数据
      const defaultProvider = new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      setProvider(defaultProvider);
    }
  }, []);

  // 连接钱包函数
  const connectWallet = async () => {
    try {
      const instance = await web3Modal.connect();
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
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet.');
    }
  };

  // 断开连接
  const disconnectWallet = () => {
    if (web3Modal.cachedProvider) {
      web3Modal.clearCachedProvider();
    }
    setProvider(new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL));
    setSigner(null);
    setAddress(null);
    toast.info('Wallet disconnected.');
  };

  // 获取合约实例的辅助函数
  const getContract = (address: string, abi: any): Contract | null => {
    if (!provider) return null;
    try {
      // 如果存在签名者，使用签名者（可写），否则使用只读提供者
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
    isConnected: !!address,
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

// 4. 自定义Hook，方便在组件中使用Context
export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}