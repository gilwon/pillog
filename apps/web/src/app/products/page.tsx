'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/common/SearchBar'
import { ProductCard } from '@/features/products/components/ProductCard'
import { useProductSearch } from '@/features/products/hooks/useProductSearch'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

function ProductSearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const page = Number(searchParams.get('page')) || 1
  const match = (searchParams.get('match') === 'any' ? 'any' : 'all') as 'all' | 'any'

  const { data, isLoading, error } = useProductSearch(query, page, match)

  const isMultiWord = query.trim().split(/\s+/).length > 1

  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value.trim()) params.set('q', value.trim())
    if (match !== 'all') params.set('match', match)
    router.push(`/products?${params}`)
  }

  const handleMatchChange = (newMatch: 'all' | 'any') => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (newMatch !== 'all') params.set('match', newMatch)
    router.push(`/products?${params}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">제품 검색</h1>
      <SearchBar defaultValue={query} className="mb-3" onSearch={handleSearch} />

      {isMultiWord && (
        <div className="mb-6 flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">검색 방식</span>
          <button
            onClick={() => handleMatchChange('all')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              match === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            모든 단어 포함
          </button>
          <button
            onClick={() => handleMatchChange('any')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              match === 'any'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            하나라도 포함
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>검색 중 오류가 발생했습니다. 다시 시도해주세요.</AlertDescription>
        </Alert>
      )}

      {data && data.data.length === 0 && query && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg font-medium">
            &lsquo;{query}&rsquo;에 대한 결과를 찾지 못했습니다.
          </p>
          <p className="mt-2 text-sm">다른 키워드로 검색해보세요.</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            총 {data.pagination.total}개 결과
          </p>
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from(
                { length: Math.min(data.pagination.total_pages, 10) },
                (_, i) => i + 1
              ).map((p) => (
                <a
                  key={p}
                  href={`/products?q=${encodeURIComponent(query)}&page=${p}${match !== 'all' ? `&match=${match}` : ''}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-sm ${
                    p === page
                      ? 'bg-primary font-medium text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      )}

      {!query && !isLoading && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">영양제 이름이나 성분을 검색해보세요.</p>
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProductSearchContent />
    </Suspense>
  )
}
