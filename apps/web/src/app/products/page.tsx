'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/common/SearchBar'
import { ProductCard } from '@/features/products/components/ProductCard'
import { useProductSearch } from '@/features/products/hooks/useProductSearch'
import { Loader2, Search } from 'lucide-react'
import { Suspense } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/lib/button-variants'
import Link from 'next/link'

const POPULAR_TAGS = [
  '항산화', '피부건강', '면역력', '피로회복',
  '눈건강', '장건강', '뼈건강', '혈행개선',
]

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
      <h1 className="animate-fade-in-up mb-6 text-2xl font-bold sm:text-3xl">제품 검색</h1>
      <div className="animate-fade-in-up stagger-1 relative z-10">
        <SearchBar defaultValue={query} className="mb-3" onSearch={handleSearch} />
      </div>
      {!query && (
        <div className="relative z-0 mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground/60">인기</span>
          {POPULAR_TAGS.map((tag) => (
            <Link
              key={tag}
              href={`/products?q=${encodeURIComponent(tag)}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-7 rounded-full border-border/50 px-3 text-xs transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
              )}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {isMultiWord && (
        <div className="animate-fade-in mb-6 flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">검색 방식</span>
          <button
            onClick={() => handleMatchChange('all')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              match === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border text-muted-foreground hover:bg-muted'
            )}
          >
            모든 단어 포함
          </button>
          <button
            onClick={() => handleMatchChange('any')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              match === 'any'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border text-muted-foreground hover:bg-muted'
            )}
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
        <div className="animate-scale-in py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Search className="h-6 w-6 text-muted-foreground/70" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            &lsquo;{query}&rsquo;에 대한 결과를 찾지 못했습니다.
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70">다른 키워드로 검색해보세요.</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <div className="animate-fade-in-up stagger-2">
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
            <div className="mt-8 flex items-center justify-center gap-1.5">
              {Array.from(
                { length: Math.min(data.pagination.total_pages, 10) },
                (_, i) => i + 1
              ).map((p) => (
                <a
                  key={p}
                  href={`/products?q=${encodeURIComponent(query)}&page=${p}${match !== 'all' ? `&match=${match}` : ''}`}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-all',
                    p === page
                      ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                      : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {!query && !isLoading && (
        <div className="animate-scale-in py-20 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Search className="h-6 w-6 text-muted-foreground/70" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">영양제 이름이나 성분을 검색해보세요.</p>
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
