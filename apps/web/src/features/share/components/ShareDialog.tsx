'use client'

import { useState } from 'react'
import { Share2, Check, Copy, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateShare } from '@/features/share/hooks/useCreateShare'
import { KakaoShareButton } from './KakaoShareButton'
import type { CompareShareData } from '@/types/database'

interface ShareDialogProps {
  type: 'supplements' | 'compare'
  data?: CompareShareData
  className?: string
}

export function ShareDialog({ type, data, className }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { shareResult, isLoading, error, createShare } = useCreateShare()

  const handleOpen = async () => {
    setIsOpen(true)
    if (!shareResult) {
      await createShare(type, data)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleCopy = async () => {
    if (!shareResult) return
    await navigator.clipboard.writeText(shareResult.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const title = type === 'supplements' ? '영양제 목록' : '비교 결과'

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground',
          className
        )}
      >
        <Share2 className="h-4 w-4" />
        <span>공유</span>
      </button>

      {/* Dialog overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {title} 공유하기
              </h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  공유 링크 생성 중...
                </span>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {shareResult && (
              <div className="space-y-4">
                {/* Share URL */}
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
                  <input
                    type="text"
                    readOnly
                    value={shareResult.url}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        복사
                      </>
                    )}
                  </button>
                </div>

                {/* KakaoTalk share */}
                <KakaoShareButton
                  url={shareResult.url}
                  title={`내 ${title}`}
                  description="영양제 성분 분석 결과를 확인해보세요."
                />

                {/* Expiration notice */}
                <p className="text-xs text-muted-foreground">
                  공유 링크는 30일간 유효합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
