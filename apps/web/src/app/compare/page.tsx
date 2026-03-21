'use client'

import { useRef } from 'react'
import { CompareTable } from '@/features/compare/components/CompareTable'
import { CompareProductSearch } from '@/features/compare/components/CompareProductSearch'
import { useCompareStore } from '@/features/compare/store/compare-store'
import { ShareDialog } from '@/features/share/components/ShareDialog'
import { ScaleIcon, X, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function ComparePage() {
  const { items, removeItem, reorderItems, clearAll } = useCompareStore()
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="animate-fade-in-up mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <ScaleIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">제품 비교</h1>
            {items.length > 0 && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {items.length}개 제품 비교 중
              </p>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <ShareDialog
              type="compare"
              data={{
                products: items.map((i) => ({
                  id: i.id,
                  name: i.name,
                  company: i.company,
                })),
                comparison_table: [],
              }}
            />
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              전체 삭제
            </button>
          </div>
        )}
      </div>

      {/* Inline product search */}
      {items.length < 4 && (
        <div className="animate-fade-in-up stagger-1 mb-4">
          <CompareProductSearch />
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="animate-scale-in py-16 text-center text-muted-foreground">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ScaleIcon className="h-6 w-6 text-muted-foreground/70" />
          </div>
          <p className="text-sm font-medium">위에서 제품을 검색해 비교를 시작하세요.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">최대 4개 제품을 나란히 비교할 수 있습니다.</p>
        </div>
      )}

      {/* Selected product chips (draggable) */}
      {items.length > 0 && (
        <div className="animate-fade-in mb-6 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => { dragItem.current = index }}
              onDragOver={(e) => { e.preventDefault(); dragOverItem.current = index }}
              onDrop={() => {
                if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
                  reorderItems(dragItem.current, dragOverItem.current)
                }
                dragItem.current = null
                dragOverItem.current = null
              }}
              className={cn(
                'group flex cursor-grab items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm transition-opacity active:cursor-grabbing',
                dragItem.current === index && 'opacity-50'
              )}
            >
              <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">{item.company}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`${item.name} 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Compare table */}
      {items.length >= 2 && (
        <div className="animate-fade-in-up stagger-2">
          <CompareTable productIds={items.map((i) => i.id)} onReorder={reorderItems} />
        </div>
      )}

      {items.length === 1 && (
        <p className="animate-fade-in py-6 text-center text-sm text-muted-foreground">
          제품을 1개 더 추가하면 비교를 시작합니다.
        </p>
      )}
    </div>
  )
}
