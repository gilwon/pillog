'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Check, Loader2, Minus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProductSearchResult } from '@/types/database'

async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const res = await fetch(
    `/api/products/search?q=${encodeURIComponent(query)}&limit=5`
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.data ?? []
}

async function addSupplement(product_id: string, daily_dose: number) {
  const res = await fetch('/api/my/supplements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id, daily_dose }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error?.message || '추가에 실패했습니다.')
  }
  return res.json()
}

interface SupplementSearchProps {
  existingProductIds: string[]
  onAdded?: () => void
}

export function SupplementSearch({
  existingProductIds,
  onAdded,
}: SupplementSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<ProductSearchResult | null>(null)
  const [dose, setDose] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: () => addSupplement(selected!.id, dose),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplements'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setSelected(null)
      setQuery('')
      setDose(1)
      onAdded?.()
    },
  })

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await searchProducts(query)
        setResults(data)
        setIsOpen(true)
      } catch {
        // silent
      } finally {
        setIsSearching(false)
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

  const isAlreadyAdded = (id: string) => existingProductIds.includes(id)

  const handleSelect = (product: ProductSearchResult) => {
    if (isAlreadyAdded(product.id)) return
    setSelected(product)
    setQuery(product.name)
    setIsOpen(false)
    setDose(1)
  }

  const handleCancel = () => {
    setSelected(null)
    setQuery('')
    setDose(1)
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="추가할 영양제 이름 검색..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (selected) setSelected(null)
            }}
            onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
            {results.map((product) => {
              const added = isAlreadyAdded(product.id)
              return (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  disabled={added}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-muted disabled:cursor-default disabled:opacity-60"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.company}
                    </div>
                  </div>
                  {added ? (
                    <span className="flex items-center gap-1 text-xs text-safe">
                      <Check className="h-3.5 w-3.5" />
                      등록됨
                    </span>
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {isOpen && results.length === 0 && !isSearching && query.trim() && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background px-3 py-3 text-center text-sm text-muted-foreground shadow-lg">
            검색 결과가 없습니다
          </div>
        )}
      </div>

      {/* Selected product — dose selection + confirm */}
      {selected && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="mb-2 text-sm font-medium">{selected.name}</p>
          <p className="mb-3 text-xs text-muted-foreground">{selected.company}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">복용량</span>
            <div className="flex items-center gap-1 rounded-md border border-border bg-background">
              <button
                onClick={() => setDose((d) => Math.max(1, d - 1))}
                disabled={dose <= 1}
                className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-sm font-medium">{dose}</span>
              <button
                onClick={() => setDose((d) => Math.min(5, d + 1))}
                disabled={dose >= 5}
                className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">회/일</span>

            <div className="ml-auto flex gap-2">
              <button
                onClick={handleCancel}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                취소
              </button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending}
                className="flex items-center gap-1 rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {addMutation.isPending && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                등록
              </button>
            </div>
          </div>
          {addMutation.isError && (
            <p className="mt-2 text-xs text-destructive">
              {(addMutation.error as Error)?.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
