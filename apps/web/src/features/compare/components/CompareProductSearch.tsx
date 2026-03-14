'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Check } from 'lucide-react'
import { useCompareStore, MAX_COMPARE_ITEMS } from '../store/compare-store'
import type { ProductSearchResult } from '@/types/database'

async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const res = await fetch(
    `/api/products/search?q=${encodeURIComponent(query)}&limit=5`
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.data ?? []
}

interface CompareProductSearchProps {
  className?: string
}

export function CompareProductSearch({ className }: CompareProductSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { addItem, isMaxed, items } = useCompareStore()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const data = await searchProducts(query)
        setResults(data)
        setIsOpen(true)
      } catch {
        // silent fail
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const isAlreadyAdded = (id: string) => items.some((i) => i.id === id)

  const handleSelect = (product: ProductSearchResult) => {
    if (isAlreadyAdded(product.id) || isMaxed()) return
    addItem({ id: product.id, name: product.name, company: product.company })
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const maxed = isMaxed()

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder={
            maxed
              ? `최대 ${MAX_COMPARE_ITEMS}개 제품을 선택했습니다`
              : '비교할 제품 이름 검색...'
          }
          value={query}
          disabled={maxed}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        {isLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
          {results.map((product) => {
            const added = isAlreadyAdded(product.id)
            return (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                disabled={added}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-muted disabled:cursor-default"
              >
                <div>
                  <div className={added ? 'text-muted-foreground' : 'font-medium'}>
                    {product.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {product.company}
                  </div>
                </div>
                {added ? (
                  <span className="flex items-center gap-1 text-xs text-safe">
                    <Check className="h-3.5 w-3.5" />
                    추가됨
                  </span>
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {isOpen && results.length === 0 && !isLoading && query.trim() && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background px-3 py-3 text-center text-sm text-muted-foreground shadow-lg">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  )
}
