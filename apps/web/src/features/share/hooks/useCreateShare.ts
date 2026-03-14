import { useState, useCallback } from 'react'
import type { CompareShareData } from '@/types/database'

interface ShareResult {
  token: string
  url: string
  expires_at: string
}

interface UseCreateShareResult {
  shareResult: ShareResult | null
  isLoading: boolean
  error: string | null
  createShare: (
    type: 'supplements' | 'compare',
    data?: CompareShareData
  ) => Promise<ShareResult | null>
}

export function useCreateShare(): UseCreateShareResult {
  const [shareResult, setShareResult] = useState<ShareResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createShare = useCallback(
    async (
      type: 'supplements' | 'compare',
      data?: CompareShareData
    ): Promise<ShareResult | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/my/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, data }),
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error?.message || '공유 링크 생성에 실패했습니다.')
        }

        const result: ShareResult = await res.json()
        setShareResult(result)
        return result
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '공유 링크 생성에 실패했습니다.'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { shareResult, isLoading, error, createShare }
}
