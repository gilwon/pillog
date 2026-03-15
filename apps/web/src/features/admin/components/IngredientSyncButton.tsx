'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DatabaseZap } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface SyncProgress {
  batch: number
  totalBatches: number
  total: number
  linked?: number
}

interface SyncResult {
  count: number
  matchedProducts?: number
  message: string
}

export function IngredientSyncButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const runSync = async () => {
    setIsLoading(true)
    setProgress(null)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/admin/ingredients/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error?.message || '동기화 실패')
        return
      }

      if (!res.body) {
        setError('스트림 응답을 받을 수 없습니다.')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line)
            if (msg.type === 'start') {
              setProgress({ batch: 0, totalBatches: msg.totalBatches, total: msg.total })
            } else if (msg.type === 'progress') {
              setProgress({
                batch: msg.batch,
                totalBatches: msg.totalBatches,
                total: msg.total,
                linked: msg.linked,
              })
            } else if (msg.type === 'done') {
              setResult({
                count: msg.count,
                matchedProducts: msg.matchedProducts,
                message: msg.message,
              })
              queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients'] })
              queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
            } else if (msg.type === 'error') {
              setError(msg.message)
            }
          } catch {
            // invalid JSON, skip
          }
        }
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }

  const pct = progress
    ? Math.round((progress.batch / Math.max(progress.totalBatches, 1)) * 100)
    : 0

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={runSync}
        disabled={isLoading}
      >
        <DatabaseZap className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
        {isLoading ? '제품-성분 연결 중...' : '제품-성분 연결'}
      </Button>

      {/* 진행 상황 */}
      {isLoading && progress && (
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>연결 중... {pct}%</span>
            <span>{(progress.linked ?? 0).toLocaleString()}개 연결됨</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            전체 {progress.total.toLocaleString()}개 제품 중 배치 {progress.batch}/{progress.totalBatches}
          </p>
        </div>
      )}
      {isLoading && !progress && (
        <p className="text-xs text-muted-foreground">데이터베이스 연결 중...</p>
      )}

      {result && !isLoading && (
        <p className="text-xs text-green-600 dark:text-green-400 text-right">
          {result.message}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive text-right">{error}</p>
      )}
    </div>
  )
}
