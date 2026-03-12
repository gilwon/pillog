'use client'

import Link from 'next/link'
import { FunctionalityTag } from '@/components/common/FunctionalityTag'
import { useCompareStore } from '@/features/compare/store/compare-store'
import { Plus, Check } from 'lucide-react'
import type { ProductSearchResult } from '@/types/database'

interface ProductCardProps {
  product: ProductSearchResult
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, removeItem } = useCompareStore()
  const isInCompare = items.some((item) => item.id === product.id)
  const isCompareMaxed = items.length >= 4

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
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.company}
          </p>
        </div>
        <button
          onClick={handleCompareToggle}
          disabled={!isInCompare && isCompareMaxed}
          className={`ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm transition-colors ${
            isInCompare
              ? 'border-primary bg-primary/10 text-primary'
              : isCompareMaxed
                ? 'cursor-not-allowed border-border text-muted-foreground opacity-50'
                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
          }`}
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
        </button>
      </div>

      {product.shape && (
        <p className="mt-2 text-xs text-muted-foreground">{product.shape}</p>
      )}

      {product.functionality_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {product.functionality_tags.slice(0, 3).map((tag) => (
            <FunctionalityTag key={tag} tag={tag} />
          ))}
          {product.functionality_tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{product.functionality_tags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
