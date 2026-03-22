'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAdminProducts, useToggleProduct, useDeleteProduct, useBulkDeleteProducts } from '../hooks/useAdminProducts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ChevronLeft, ChevronRight, Power, Pencil, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw, Trash2 } from 'lucide-react'
import { AdminSearchInput } from './AdminSearchInput'

export function ProductsTable() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('reported_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useAdminProducts({ q: query, status, page, limit: 20, sortBy, sortOrder })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />
    return sortOrder === 'asc'
      ? <ChevronUp className="ml-1 inline h-3 w-3" />
      : <ChevronDown className="ml-1 inline h-3 w-3" />
  }
  const toggleMutation = useToggleProduct()
  const deleteMutation = useDeleteProduct()
  const bulkDeleteMutation = useBulkDeleteProducts()

  const pageIds = data?.data.map((p) => p.id) ?? []
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
    if (!confirm(`선택한 ${ids.length}개 제품을 삭제하시겠습니까?\n관련된 사용자 데이터도 함께 삭제됩니다.`)) return
    bulkDeleteMutation.mutate(ids, {
      onSuccess: () => setSelectedIds(new Set()),
    })
  }

  // 페이지/필터 변경 시 선택 초기화
  const handleFilterChange = (fn: () => void) => {
    setSelectedIds(new Set())
    fn()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>제품 목록</CardTitle>
          <div className="flex items-center gap-2">
            {someSelected && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {selectedIds.size}개 삭제
              </Button>
            )}
            <Link href="/admin/products/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                제품 등록
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AdminSearchInput
            placeholder="제품명, 업체명, 신고번호 검색..."
            type="products"
            onSearch={(q) => handleFilterChange(() => { setQuery(q); setPage(1) })}
          />
          <div className="flex gap-1.5">
            {[
              { value: '', label: '전체' },
              { value: 'active', label: '활성' },
              { value: 'inactive', label: '비활성' },
              { value: 'removed', label: 'API 제거' },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={status === opt.value ? 'default' : 'outline'}
                size="sm"
                className={opt.value === 'removed' && status !== 'removed' ? 'border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950' : ''}
                onClick={() => handleFilterChange(() => { setStatus(opt.value); setPage(1) })}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status === 'removed' && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            식약처 전체 동기화에서 더 이상 조회되지 않는 제품입니다. 복용 중인 사용자 데이터는 보존되어 있습니다.
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {status === 'removed' ? 'API 제거된 제품이 없습니다.' : query ? '검색 결과가 없습니다.' : '등록된 제품이 없습니다.'}
          </p>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-2 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                      <button onClick={() => handleSort('name')} className="flex items-center hover:text-foreground">
                        제품명<SortIcon column="name" />
                      </button>
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      <button onClick={() => handleSort('company')} className="flex items-center hover:text-foreground">
                        업체<SortIcon column="company" />
                      </button>
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-muted-foreground hidden md:table-cell">
                      <button onClick={() => handleSort('report_no')} className="flex items-center hover:text-foreground">
                        신고번호<SortIcon column="report_no" />
                      </button>
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-muted-foreground hidden lg:table-cell">
                      <button onClick={() => handleSort('reported_at')} className="flex items-center hover:text-foreground">
                        {status === 'removed' ? '마지막 동기화' : '신고일'}<SortIcon column={status === 'removed' ? 'synced_at' : 'reported_at'} />
                      </button>
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-muted-foreground hidden lg:table-cell">
                      <button onClick={() => handleSort('created_at')} className="flex items-center hover:text-foreground">
                        등록일<SortIcon column="created_at" />
                      </button>
                    </th>
                    {status !== 'removed' && (
                      <th className="pb-3 pr-4 text-center font-medium text-muted-foreground">
                        <button onClick={() => handleSort('is_active')} className="inline-flex items-center hover:text-foreground">
                          상태<SortIcon column="is_active" />
                        </button>
                      </th>
                    )}
                    <th className="pb-3 text-right font-medium text-muted-foreground">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b border-border last:border-0 ${selectedIds.has(product.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/admin/products/${product.id}/edit`} className="font-medium hover:text-primary hover:underline">
                          {product.name}
                        </Link>
                        <div className="text-xs text-muted-foreground sm:hidden">{product.company}</div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground hidden sm:table-cell">
                        {product.company}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">
                        <span className="font-mono text-xs">{product.report_no}</span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground hidden lg:table-cell">
                        <span className="text-xs">
                          {status === 'removed'
                            ? (product.synced_at ? product.synced_at.slice(0, 10) : '-')
                            : (product.reported_at ?? '-')}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground hidden lg:table-cell">
                        <span className="text-xs">{product.created_at.slice(0, 10)}</span>
                      </td>
                      {status !== 'removed' && (
                        <td className="py-3 pr-4 text-center">
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? '활성' : '비활성'}
                          </Badge>
                        </td>
                      )}
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          {status === 'removed' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="복원 (활성화)"
                                onClick={() => toggleMutation.mutate(product.id)}
                                disabled={toggleMutation.isPending || deleteMutation.isPending}
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="영구 삭제"
                                onClick={() => {
                                  if (confirm(`"${product.name}" 제품을 영구 삭제하시겠습니까?\n복용 중인 사용자 데이터도 함께 삭제됩니다.`)) {
                                    deleteMutation.mutate(product.id)
                                  }
                                }}
                                disabled={toggleMutation.isPending || deleteMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Button variant="ghost" size="icon-sm" title="수정">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title={product.is_active ? '비활성화' : '활성화'}
                                onClick={() => toggleMutation.mutate(product.id)}
                                disabled={toggleMutation.isPending}
                              >
                                <Power className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.total_pages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {someSelected && (
                    <span className="mr-2 font-medium text-primary">{selectedIds.size}개 선택됨 ·</span>
                  )}
                  {data.pagination.total.toLocaleString()}개 중 {((page - 1) * 20 + 1).toLocaleString()}-{Math.min(page * 20, data.pagination.total).toLocaleString()}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelectedIds(new Set()) }}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-2 text-sm text-muted-foreground">
                    {page} / {data.pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => { setPage((p) => Math.min(data.pagination.total_pages, p + 1)); setSelectedIds(new Set()) }}
                    disabled={page >= data.pagination.total_pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
