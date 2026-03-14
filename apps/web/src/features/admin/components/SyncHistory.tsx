'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { SyncLogDetail } from './SyncLogDetail'
import type { SyncLog, SyncLogsResponse } from '@/types/api'

async function fetchSyncLogs(): Promise<SyncLogsResponse> {
  const res = await fetch('/api/admin/sync/logs?limit=10')
  if (!res.ok) throw new Error('Failed to fetch sync logs')
  return res.json()
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

export function SyncHistory() {
  const queryClient = useQueryClient()
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sync', 'logs'],
    queryFn: fetchSyncLogs,
    staleTime: 30 * 1000,
  })

  return (
    <>
      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">동기화 이력</h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'sync', 'logs'] })}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
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
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.data.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    동기화 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                data.data.map((log) => (
                  <tr
                    key={log.id}
                    className="cursor-pointer border-b border-border/50 hover:bg-muted/30 transition-colors"
                    onClick={() => setSelectedLogId(log.id)}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {format(new Date(log.started_at), 'M/d HH:mm')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${log.sync_type === 'full' ? 'text-purple-600 dark:text-purple-400' : 'text-foreground'}`}>
                        {log.sync_type === 'full' ? '전체' : '증분'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-green-600 dark:text-green-400">
                      {log.new_count > 0 ? `+${log.new_count.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-blue-600 dark:text-blue-400">
                      {log.updated_count > 0 ? log.updated_count.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                      {log.deactivated_count > 0 ? log.deactivated_count.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                      {getDuration(log.started_at, log.completed_at)}
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
