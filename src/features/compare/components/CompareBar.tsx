'use client'

import { useCompareStore, MAX_COMPARE_ITEMS } from '../store/compare-store'
import { X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CompareBar() {
  const { items, removeItem, clearAll } = useCompareStore()

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-sm font-medium">
            비교 ({items.length}/{MAX_COMPARE_ITEMS})
          </span>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
            >
              <span className="max-w-[120px] truncate">{item.name}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={clearAll}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            초기화
          </button>
          {items.length >= 2 && (
            <Link
              href="/compare"
              className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              비교하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
