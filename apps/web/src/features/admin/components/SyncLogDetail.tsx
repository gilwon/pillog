'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { SyncLogDetailResponse } from '@/types/api'

type ChangeType = 'new' | 'updated' | 'deactivated'

const TAB_CONFIG: { key: ChangeType; label: string; color: string }[] = [
  { key: 'new', label: '신규', color: 'text-green-600 dark:text-green-400' },
  { key: 'updated', label: '업데이트', color: 'text-blue-600 dark:text-blue-400' },
  { key: 'deactivated', label: '비활성화', color: 'text-amber-600 dark:text-amber-400' },
]

async function fetchLogDetail(id: string, type: ChangeType, page: number): Promise<SyncLogDetailResponse> {
  const res = await fetch(`/api/admin/sync/logs/${id}?type=${type}&page=${page}&limit=50`)
  if (!res.ok) throw new Error('Failed to fetch sync log detail')
  return res.json()
}

interface Props {
  logId: string
  onClose: () => void
}

export function SyncLogDetail({ logId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ChangeType>('new')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sync', 'log', logId, activeTab, page],
    queryFn: () => fetchLogDetail(logId, activeTab, page),
    staleTime: 60 * 1000,
  })

  const handleTabChange = (tab: ChangeType) => {
    setActiveTab(tab)
    setPage(1)
  }

  const log = data?.log
  const totalForTab = {
    new: log?.new_count ?? 0,
    updated: log?.updated_count ?? 0,
    deactivated: log?.deactivated_count ?? 0,
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background shadow-xl sm:w-[560px]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">동기화 상세 이력</h2>
            {log && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {format(new Date(log.started_at), 'yyyy-MM-dd HH:mm:ss')} ·{' '}
                {log.sync_type === 'full' ? '전체 동기화' : '증분 동기화'}
                {log.change_date && ` (${log.change_date})`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary bar */}
        {log && (
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`py-3 text-center transition-colors hover:bg-muted/50 ${activeTab === tab.key ? 'bg-muted/70' : ''}`}
              >
                <p className={`text-lg font-bold ${tab.color}`}>
                  {totalForTab[tab.key].toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{tab.label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-px p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !data?.products.length ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              해당 유형의 제품이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {data.products.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/20">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${item.product.id}`}
                      className="text-sm font-medium hover:text-primary hover:underline"
                      onClick={onClose}
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.product.company} · {item.product.report_no}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-muted-foreground">
              {((page - 1) * 50 + 1).toLocaleString()}–{Math.min(page * 50, data.pagination.total).toLocaleString()} / {data.pagination.total.toLocaleString()}개
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-muted"
              >
                이전
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.total_pages, p + 1))}
                disabled={page >= data.pagination.total_pages}
                className="rounded border border-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-muted"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
