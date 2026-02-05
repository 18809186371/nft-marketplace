'use client'
import Link from 'next/link'
import { ConnectButton } from './ConnectButton'
import { Home, PlusCircle, User } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/marketplace" className="flex items-center gap-2 text-xl font-bold">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600" />
            <span>NFT Market</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="h-4 w-4" />
              Marketplace
            </Link>
            <Link
              href="/mint"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Create NFT
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <User className="h-4 w-4" />
              My Profile
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}