'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DatabaseZap, ChevronDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

type SyncMode = 'extract' | 'match'

interface SyncProgress {
  batch: number
  totalBatches: number
  total: number
  // extract mode
  found?: number
  // match mode
  linked?: number
}

interface LinkProgress {
  linked: number
  totalRows: number
}

interface SyncResult {
  mode: SyncMode
  count: number
  candidates?: number
  matchedProducts?: number
  linked?: number
  message: string
}

export function IngredientSyncButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<SyncMode | null>(null)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [linkProgress, setLinkProgress] = useState<LinkProgress | null>(null)
  const [phase, setPhase] = useState<'extract' | 'link' | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const queryClient = useQueryClient()

  const runSync = async (syncMode: SyncMode) => {
    setIsLoading(true)
    setMode(syncMode)
    setProgress(null)
    setLinkProgress(null)
    setPhase(null)
    setResult(null)
    setError(null)
    setShowMenu(false)

    try {
      const res = await fetch('/api/admin/ingredients/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: syncMode }),
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
              setPhase(syncMode === 'extract' ? 'extract' : null)
              setProgress({ batch: 0, totalBatches: msg.totalBatches, total: msg.total })
            } else if (msg.type === 'progress') {
              setProgress({
                batch: msg.batch,
                totalBatches: msg.totalBatches,
                total: msg.total,
                found: msg.found,
                linked: msg.linked,
              })
            } else if (msg.type === 'extract_done') {
              // extract 완료, 연결 단계로 전환
              setProgress(null)
            } else if (msg.type === 'link_start') {
              setPhase('link')
              setLinkProgress({ linked: 0, totalRows: 0 })
            } else if (msg.type === 'link_progress') {
              setLinkProgress({ linked: msg.linked, totalRows: msg.totalRows })
            } else if (msg.type === 'done') {
              setResult({
                mode: msg.mode,
                count: msg.count,
                candidates: msg.candidates,
                matchedProducts: msg.matchedProducts,
                linked: msg.linked,
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
      setLinkProgress(null)
      setPhase(null)
    }
  }

  const pct = progress
    ? Math.round((progress.batch / Math.max(progress.totalBatches, 1)) * 100)
    : linkProgress
      ? Math.round((linkProgress.linked / Math.max(linkProgress.totalRows, 1)) * 100)
      : 0

  const progressLabel =
    phase === 'link'
      ? `${(linkProgress?.linked ?? 0).toLocaleString()}개 연결됨`
      : mode === 'extract'
        ? `후보 ${(progress?.found ?? 0).toLocaleString()}개 발견`
        : `${(progress?.linked ?? 0).toLocaleString()}개 연결됨`

  const modeLabel =
    phase === 'link'
      ? '제품-성분 연결 중...'
      : mode === 'extract'
        ? '성분 추출 중...'
        : '제품 연결 중...'

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="relative flex">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-r-none border-r-0"
          onClick={() => runSync('extract')}
          disabled={isLoading}
        >
          <DatabaseZap className={`h-4 w-4 ${isLoading && mode === 'extract' ? 'animate-pulse' : ''}`} />
          {isLoading && mode === 'extract' ? '성분 추출 중...' : '미매칭 성분 추출'}
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
          <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-md border border-border bg-background shadow-md">
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              onClick={() => runSync('extract')}
            >
              미매칭 성분 추출
              <p className="text-xs text-muted-foreground">
                제품 원재료에서 새 성분 발굴
              </p>
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              onClick={() => runSync('match')}
            >
              제품-성분 연결
              <p className="text-xs text-muted-foreground">
                제품을 등록된 성분에 매핑
              </p>
            </button>
          </div>
        )}
      </div>

      {/* 진행 상황 */}
      {isLoading && (progress || linkProgress) && (
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{modeLabel} {pct}%</span>
            <span>{progressLabel}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {phase === 'link'
              ? `${(linkProgress?.linked ?? 0).toLocaleString()} / ${(linkProgress?.totalRows ?? 0).toLocaleString()}건 연결`
              : `전체 ${(progress?.total ?? 0).toLocaleString()}개 제품 중 배치 ${progress?.batch ?? 0}/${progress?.totalBatches ?? 0}`}
          </p>
        </div>
      )}
      {isLoading && !progress && !linkProgress && (
        <p className="text-xs text-muted-foreground">데이터베이스 연결 중...</p>
      )}

      {result && !isLoading && (
        <div className="text-xs text-green-600 dark:text-green-400 text-right space-y-0.5">
          <p>{result.message}</p>
          {result.mode === 'extract' && result.linked != null && result.linked > 0 && (
            <p className="text-muted-foreground">
              (자동 연결 {result.linked.toLocaleString()}건 포함)
            </p>
          )}
        </div>
      )}
      {error && (
        <p className="text-xs text-destructive text-right">{error}</p>
      )}
    </div>
  )
}
