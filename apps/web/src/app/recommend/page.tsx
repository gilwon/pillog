'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { HealthConcernSelector } from '@/features/recommendation/components/HealthConcernSelector'
import { RecommendedProductCard } from '@/features/recommendation/components/RecommendedProductCard'
import { useHealthConcerns } from '@/features/recommendation/hooks/useHealthConcerns'
import { useRecommendation } from '@/features/recommendation/hooks/useRecommendation'
import { HEALTH_CONCERNS, HEALTH_CONCERN_MAP } from '@/features/recommendation/constants/health-concerns'
import type { RecommendedProduct } from '@/features/recommendation/types'

const PAGE_SIZE_OPTIONS = [15, 30, 50, 100] as const

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm disabled:opacity-40 hover:bg-muted"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
              p === page
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm disabled:opacity-40 hover:bg-muted"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function PaginatedGrid({
  items,
  pageSize,
}: {
  items: RecommendedProduct[]
  pageSize: number
}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / pageSize)
  const paginated = items.slice((page - 1) * pageSize, page * pageSize)

  const handlePage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // reset to page 1 when items or pageSize changes
  useEffect(() => { setPage(1) }, [items, pageSize])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginated.map((product) => (
          <RecommendedProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={handlePage} />
    </div>
  )
}

export default function RecommendPage() {
  const { selectedConcerns, toggleConcern, clearConcerns } = useHealthConcerns()
  const { products, loading, searched, error, fetchRecommendations, reset } = useRecommendation()
  const [pageSize, setPageSize] = useState<number>(15)

  const selectedLabels = selectedConcerns
    .map((k) => HEALTH_CONCERNS.find((c) => c.key === k)?.label ?? k)
    .join(' · ')

  const [activeTab, setActiveTab] = useState<'full' | 'partial'>('full')

  // concern 단위로 매칭 여부 판정 → 전체/부분 그룹 분리
  const { fullMatches, partialMatches } = useMemo(() => {
    if (selectedConcerns.length <= 1 || products.length === 0) {
      return { fullMatches: products, partialMatches: [] as RecommendedProduct[] }
    }

    const full: RecommendedProduct[] = []
    const partial: RecommendedProduct[] = []

    for (const product of products) {
      const matchedConcernCount = selectedConcerns.filter((concern) => {
        const keywords = HEALTH_CONCERN_MAP[concern]
        return product.matchedTags.some((tag) =>
          keywords.some((k) => tag.includes(k) || k.includes(tag))
        )
      }).length

      if (matchedConcernCount === selectedConcerns.length) {
        full.push(product)
      } else {
        partial.push(product)
      }
    }

    return { fullMatches: full, partialMatches: partial }
  }, [products, selectedConcerns])

  const handleSearch = async () => {
    setActiveTab('full')
    await fetchRecommendations(selectedConcerns)
  }

  const handleReset = () => {
    clearConcerns()
    reset()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      <HealthConcernSelector selected={selectedConcerns} onToggle={toggleConcern} />

      <div className="flex gap-3">
        <Button
          onClick={handleSearch}
          disabled={selectedConcerns.length === 0 || loading}
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          내 맞춤 영양제 보기
        </Button>
        {(selectedConcerns.length > 0 || searched) && (
          <Button variant="outline" size="lg" onClick={handleReset}>
            초기화
          </Button>
        )}
      </div>

      {searched && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">{selectedLabels} 맞춤 추천</h2>
              {/* <p className="mt-1 text-sm text-muted-foreground">
                총 {total.toLocaleString()}개 제품 · 정렬: 신고일 최신순
              </p> */}
            </div>
            {/* 페이지 크기 선택 */}
            {products.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">페이지당</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}개</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription className="text-center font-medium">{error}</AlertDescription>
            </Alert>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <p className="text-lg font-medium">매칭 제품이 없습니다</p>
              <p className="mt-2 text-sm">다른 건강 고민을 선택해 보세요.</p>
            </div>
          ) : selectedConcerns.length > 1 ? (
            <div className="space-y-4">
              {/* 탭 헤더 */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('full')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'full'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  모든 고민에 맞는 제품
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                    {fullMatches.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('partial')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'partial'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  일부 고민에 맞는 제품
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                    {partialMatches.length}
                  </span>
                </button>
              </div>

              {/* 탭 컨텐츠 */}
              {activeTab === 'full' && (
                fullMatches.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                    <p className="font-medium">모든 고민을 동시에 해결하는 제품이 없습니다</p>
                    <p className="mt-1 text-sm">일부 고민에 맞는 제품 탭을 확인해 보세요.</p>
                  </div>
                ) : (
                  <PaginatedGrid items={fullMatches} pageSize={pageSize} />
                )
              )}

              {activeTab === 'partial' && (
                <PaginatedGrid items={partialMatches} pageSize={pageSize} />
              )}
            </div>
          ) : (
            <PaginatedGrid items={products} pageSize={pageSize} />
          )}
        </div>
      )}
    </div>
  )
}
