'use client'

import { CompareTable } from '@/features/compare/components/CompareTable'
import { useCompareStore } from '@/features/compare/store/compare-store'
import { ShareButton } from '@/components/common/ShareButton'
import { ScaleIcon } from 'lucide-react'

export default function ComparePage() {
  const { items, removeItem, clearAll } = useCompareStore()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <ScaleIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">제품 비교</h1>
        <p className="text-muted-foreground">
          비교할 제품을 검색 결과에서 추가해주세요. 최대 4개 제품을 비교할 수
          있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">제품 비교</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length}개 제품 비교 중
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton />
          <button
            onClick={clearAll}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            전체 삭제
          </button>
        </div>
      </div>

      {/* Selected products */}
      <div className="mb-6 flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm"
          >
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">{item.company}</span>
            <button
              onClick={() => removeItem(item.id)}
              className="ml-1 text-muted-foreground hover:text-destructive"
            >
              x
            </button>
          </div>
        ))}
      </div>

      <CompareTable productIds={items.map((i) => i.id)} />
    </div>
  )
}
