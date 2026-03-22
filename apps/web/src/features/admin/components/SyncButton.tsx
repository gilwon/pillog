'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, ChevronDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface SyncProgress {
  batch: number
  totalBatches: number
  upserted: number
  total: number
}

interface SyncResult {
  count: number
  total: number
  failedBatches: number
  deactivated: number
  message: string
}

interface IngredientPhase {
  active: boolean
  batch: number
  totalBatches: number
  linked: number
  total: number
  message: string | null
}

const initialIngredientPhase: IngredientPhase = {
  active: false,
  batch: 0,
  totalBatches: 0,
  linked: 0,
  total: 0,
  message: null,
}

export function SyncButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [ingredientPhase, setIngredientPhase] = useState<IngredientPhase>(initialIngredientPhase)
  const [error, setError] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const queryClient = useQueryClient()

  const runSync = async (full: boolean) => {
    setIsLoading(true)
    setProgress(null)
    setResult(null)
    setIngredientPhase(initialIngredientPhase)
    setError(null)
    setShowMenu(false)

    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const err = data.error
        if (err?.code === 'SYNC_IN_PROGRESS') {
          setError('이미 동기화가 진행 중입니다. 완료 후 다시 시도해주세요.')
        } else {
          setError(typeof err === 'string' ? err : err?.message || '동기화 실패')
        }
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
              setProgress({ batch: 0, totalBatches: msg.totalBatches, upserted: 0, total: msg.total })
            } else if (msg.type === 'progress') {
              setProgress({ batch: msg.batch, totalBatches: msg.totalBatches, upserted: msg.upserted, total: msg.total })
            } else if (msg.type === 'done') {
              setResult({ count: msg.count, total: msg.total, failedBatches: msg.failedBatches ?? 0, deactivated: msg.deactivated ?? 0, message: msg.message })
              setProgress(null)
              queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
              queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
              queryClient.invalidateQueries({ queryKey: ['admin', 'sync', 'logs'] })
            } else if (msg.type === 'ingredient-sync-start') {
              setIngredientPhase({ active: true, batch: 0, totalBatches: 0, linked: 0, total: 0, message: null })
            } else if (msg.type === 'ingredient-progress') {
              setIngredientPhase((prev) => ({
                ...prev,
                active: true,
                batch: msg.batch,
                totalBatches: msg.totalBatches,
                linked: msg.linked,
                total: msg.total,
              }))
            } else if (msg.type === 'ingredient-done') {
              setIngredientPhase({
                active: false,
                batch: 0,
                totalBatches: 0,
                linked: msg.count ?? 0,
                total: msg.total ?? 0,
                message: msg.message,
              })
              queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients'] })
            } else if (msg.type === 'warning') {
              setError(msg.message)
            } else if (msg.type === 'error') {
              setError(msg.message)
            }
          } catch {
            // invalid JSON line, skip
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

  const pct = progress && progress.totalBatches > 0 ? Math.round((progress.batch / progress.totalBatches) * 100) : 0
  const ingredientPct = ingredientPhase.active && ingredientPhase.totalBatches > 0
    ? Math.round((ingredientPhase.batch / ingredientPhase.totalBatches) * 100)
    : 0

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="relative flex">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-r-none border-r-0"
          onClick={() => runSync(false)}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? '동기화 중...' : '식약처 동기화'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-l-none px-2"
          onClick={() => setShowMenu((v) => !v)}
          disabled={isLoading}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {showMenu && (
          <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-border bg-background shadow-md">
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              onClick={() => runSync(false)}
            >
              증분 동기화 (어제 변경분)
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              onClick={() => runSync(true)}
            >
              전체 동기화 (모든 제품)
            </button>
          </div>
        )}
      </div>

      {/* 제품 동기화 진행 상황 */}
      {isLoading && progress && (
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>배치 {progress.batch}/{progress.totalBatches} · {pct}%</span>
            <span>{progress.upserted.toLocaleString()}개 처리됨</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            전체 {progress.total.toLocaleString()}개 중 {progress.upserted.toLocaleString()}개 완료
          </p>
        </div>
      )}
      {isLoading && !progress && !ingredientPhase.active && (
        <p className="text-xs text-muted-foreground">식약처 연결 중...</p>
      )}

      {/* 성분 자동 연결 진행 상황 */}
      {isLoading && ingredientPhase.active && (
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>성분 자동 연결 중...</span>
            {ingredientPhase.totalBatches > 0 && (
              <span>배치 {ingredientPhase.batch}/{ingredientPhase.totalBatches} · {ingredientPct}%</span>
            )}
          </div>
          {ingredientPhase.totalBatches > 0 && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${ingredientPct}%` }}
              />
            </div>
          )}
          {ingredientPhase.linked > 0 && (
            <p className="text-xs text-muted-foreground">
              {ingredientPhase.linked.toLocaleString()}개 성분 연결됨
            </p>
          )}
        </div>
      )}

      {/* 결과 표시 */}
      {result && !isLoading && (
        <div className="space-y-0.5 text-right">
          <p className={`text-xs ${result.failedBatches > 0 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}`}>
            {result.message}
          </p>
          {result.deactivated > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              API 제거 {result.deactivated.toLocaleString()}개 — 관리자 &gt; 제품 &gt; API 제거 탭에서 확인
            </p>
          )}
        </div>
      )}
      {ingredientPhase.message && !isLoading && (
        <p className="text-xs text-green-600 dark:text-green-400">
          {ingredientPhase.message}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
