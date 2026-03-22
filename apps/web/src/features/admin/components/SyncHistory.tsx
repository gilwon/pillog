'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { RefreshCw, Trash2, Loader2 } from 'lucide-react'
import { SyncLogDetail } from './SyncLogDetail'
import type { SyncLog, SyncLogsResponse } from '@/types/api'

async function fetchSyncLogs(): Promise<SyncLogsResponse> {
  const res = await fetch('/api/admin/sync/logs?limit=10')
  if (!res.ok) throw new Error('Failed to fetch sync logs')
  return res.json()
}

async function bulkDeleteSyncLogs(ids: string[]): Promise<void> {
  const res = await fetch('/api/admin/sync/logs/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error('Failed to delete sync logs')
}

function StatusBadge({ status }: { status: SyncLog['status'] }) {
  const map = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  const label = { completed: '완료', running: '진행중', failed: '실패' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {status === 'running' && (
        <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {label[status]}
    </span>
  )
}

function getDuration(started: string, completed: string | null) {
  if (!completed) return '-'
  const diff = Math.round((new Date(completed).getTime() - new Date(started).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  return `${Math.floor(diff / 60)}m ${diff % 60}s`
}

function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    function update() {
      const diff = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)
      if (diff < 60) setElapsed(`${diff}s`)
      else setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return <span className="tabular-nums">{elapsed}</span>
}

function RunningProgress({ log }: { log: SyncLog }) {
  const { progress_batch, progress_total_batches, total_fetched, new_count } = log
  if (progress_total_batches === 0) {
    return <span className="text-muted-foreground">준비 중...</span>
  }
  const pct = Math.round((progress_batch / progress_total_batches) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums whitespace-nowrap">
        {new_count.toLocaleString()}/{total_fetched.toLocaleString()} ({pct}%)
      </span>
    </div>
  )
}

export function SyncHistory() {
  const queryClient = useQueryClient()
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sync', 'logs'],
    queryFn: fetchSyncLogs,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const logs = query.state.data?.data
      const hasRunning = logs?.some((log) => log.status === 'running')
      return hasRunning ? 5000 : false
    },
  })

  const deleteMutation = useMutation({
    mutationFn: bulkDeleteSyncLogs,
    onSuccess: () => {
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey: ['admin', 'sync', 'logs'] })
    },
  })

  const pageIds = data?.data.map((l) => l.id) ?? []
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const someSelected = selectedIds.size > 0

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (!confirm(`선택한 ${ids.length}개 동기화 이력을 삭제하시겠습니까?`)) return
    deleteMutation.mutate(ids)
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">동기화 이력</h2>
          <div className="flex items-center gap-2">
            {someSelected && (
              <button
                onClick={handleBulkDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                {selectedIds.size}개 삭제
              </button>
            )}
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'sync', 'logs'] })}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                  />
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">일시</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">유형</th>
                <th className="px-4 py-2 text-right font-medium text-green-600 dark:text-green-400">신규</th>
                <th className="px-4 py-2 text-right font-medium text-blue-600 dark:text-blue-400">업데이트</th>
                <th className="px-4 py-2 text-right font-medium text-amber-600 dark:text-amber-400">비활성화</th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">소요시간</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.data.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    동기화 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                data.data.map((log) => (
                  <tr
                    key={log.id}
                    className={`cursor-pointer border-b border-border/50 transition-colors ${selectedIds.has(log.id) ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(log.id)}
                        onChange={() => toggleSelect(log.id)}
                        className="h-3.5 w-3.5 rounded border-border accent-primary"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground" onClick={() => setSelectedLogId(log.id)}>
                      {format(new Date(log.started_at), 'M/d HH:mm')}
                    </td>
                    <td className="px-4 py-2.5" onClick={() => setSelectedLogId(log.id)}>
                      <span className={`text-xs font-medium ${log.sync_type === 'full' ? 'text-purple-600 dark:text-purple-400' : 'text-foreground'}`}>
                        {log.sync_type === 'full' ? '전체' : '증분'}
                      </span>
                    </td>

                    {log.status === 'running' ? (
                      <td colSpan={3} className="px-4 py-2.5 text-xs" onClick={() => setSelectedLogId(log.id)}>
                        <RunningProgress log={log} />
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 text-right font-mono text-green-600 dark:text-green-400" onClick={() => setSelectedLogId(log.id)}>
                          {log.new_count > 0 ? `+${log.new_count.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-blue-600 dark:text-blue-400" onClick={() => setSelectedLogId(log.id)}>
                          {log.updated_count > 0 ? log.updated_count.toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400" onClick={() => setSelectedLogId(log.id)}>
                          {log.deactivated_count > 0 ? log.deactivated_count.toLocaleString() : '-'}
                        </td>
                      </>
                    )}

                    <td className="px-4 py-2.5 text-center" onClick={() => setSelectedLogId(log.id)}>
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground" onClick={() => setSelectedLogId(log.id)}>
                      {log.status === 'running' ? (
                        <ElapsedTime startedAt={log.started_at} />
                      ) : (
                        getDuration(log.started_at, log.completed_at)
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLogId && (
        <SyncLogDetail
          logId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
        />
      )}
    </>
  )
}
