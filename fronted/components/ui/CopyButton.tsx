'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface CopyButtonProps {
  text: string
  label?: string
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('已复制到剪贴板', { id: 'copy' })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('复制失败')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-gray-500 hover:text-purple-600 transition"
      title={label || '复制'}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  )
}