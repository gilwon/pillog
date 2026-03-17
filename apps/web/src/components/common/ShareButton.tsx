'use client'

import { Share2, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface ShareButtonProps {
  url?: string
  title?: string
  className?: string
}

export function ShareButton({ url, title, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = url || window.location.href
    const shareTitle = title || document.title

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn('gap-1.5', className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-safe" />
          <span>복사됨</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>공유</span>
        </>
      )}
    </Button>
  )
}
