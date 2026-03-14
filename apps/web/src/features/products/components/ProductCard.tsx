'use client'

import Link from 'next/link'
import { useCompareStore } from '@/features/compare/store/compare-store'
import { Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProductSearchResult } from '@/types/database'

interface ProductCardProps {
  product: ProductSearchResult
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, removeItem } = useCompareStore()
  const isInCompare = items.some((item) => item.id === product.id)
  const isCompareMaxed = items.length >= 4
  const uniqueTags = [...new Set(product.functionality_tags)]

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInCompare) {
      removeItem(product.id)
    } else if (!isCompareMaxed) {
      addItem({
        id: product.id,
        name: product.name,
        company: product.company,
      })
    }
  }

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
        <CardContent className="flex h-full flex-col p-4">
          {/* 상단: 제품명 + 비교 버튼 */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.company}
              </p>
              {product.shape && (
                <p className="mt-1 text-xs text-muted-foreground">{product.shape}</p>
              )}
            </div>
            <Button
              variant={isInCompare ? 'secondary' : 'outline'}
              size="icon"
              className={cn(
                'ml-1 h-8 w-8 shrink-0',
                isInCompare && 'bg-primary/10 text-primary border-primary hover:bg-primary/20 hover:text-primary'
              )}
              onClick={handleCompareToggle}
              disabled={!isInCompare && isCompareMaxed}
              title={
                isInCompare
                  ? '비교 목록에서 제거'
                  : isCompareMaxed
                    ? '최대 4개까지 비교 가능'
                    : '비교 목록에 추가'
              }
            >
              {isInCompare ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* 하단: 기능성 태그 (flex-1로 공간 채우기) */}
          {product.functionality_tags.length > 0 && (
            <div className="mt-3 flex flex-1 flex-wrap content-start gap-1">
              {uniqueTags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="h-auto max-w-full whitespace-normal rounded-lg bg-primary/10 text-primary border-0 hover:bg-primary/20 px-2 py-0.5 text-xs font-medium leading-snug"
                >
                  {tag}
                </Badge>
              ))}
              {uniqueTags.length > 3 && (
                <span className="flex items-center px-1 text-xs text-muted-foreground">
                  +{uniqueTags.length - 3}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
