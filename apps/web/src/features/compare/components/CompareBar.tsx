'use client'

import { useCompareStore, MAX_COMPARE_ITEMS } from '../store/compare-store'
import { X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/lib/button-variants'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function CompareBar() {
  const { items, removeItem, clearAll } = useCompareStore()

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            비교 {items.length}/{MAX_COMPARE_ITEMS}
          </span>
          <Separator orientation="vertical" className="h-4" />
          {items.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="flex shrink-0 items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 pr-1"
            >
              <span className="max-w-[120px] truncate">{item.name}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="ml-1 rounded-full hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
            초기화
          </Button>
          {items.length >= 2 && (
            <Link href="/compare" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
              비교하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
