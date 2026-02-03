'use client'
import { useWeb3 } from './Web3Provider'

export function ConnectButton() {
  const { isConnected, address, connectWallet, disconnectWallet } = useWeb3()

  // 格式化地址显示
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div>
      {isConnected && address ? (
        <div className="flex items-center gap-4">
          <span className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">
            {formatAddress(address)}
          </span>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm"
        >
          Connect Wallet
        </button>
      )}
    </div>
  )
}