'use client'

import { FunctionalityTag } from '@/components/common/FunctionalityTag'
import { ShareButton } from '@/components/common/ShareButton'
import { useCompareStore } from '@/features/compare/store/compare-store'
import { Plus, Check, Heart, Pill } from 'lucide-react'
import type { ProductWithIngredients } from '@/types/database'

interface ProductDetailProps {
  product: ProductWithIngredients
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { items, addItem, removeItem } = useCompareStore()
  const isInCompare = items.some((item) => item.id === product.id)

  const handleCompareToggle = () => {
    if (isInCompare) {
      removeItem(product.id)
    } else if (items.length < 4) {
      addItem({
        id: product.id,
        name: product.name,
        company: product.company,
      })
    }
  }

  const handleAddSupplement = async () => {
    try {
      const res = await fetch('/api/my/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })
      if (res.ok) {
        alert('내 영양제에 등록되었습니다.')
      } else {
        const data = await res.json()
        alert(data.error?.message || '등록에 실패했습니다.')
      }
    } catch {
      alert('등록에 실패했습니다.')
    }
  }

  const handleFavorite = async () => {
    try {
      const res = await fetch('/api/my/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })
      if (res.ok) {
        alert('즐겨찾기에 추가되었습니다.')
      } else {
        const data = await res.json()
        alert(data.error?.message || '추가에 실패했습니다.')
      }
    } catch {
      alert('추가에 실패했습니다.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p className="mb-1 text-sm text-muted-foreground">{product.company}</p>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        {product.report_no && (
          <p className="mt-1 text-xs text-muted-foreground">
            품목제조번호: {product.report_no}
          </p>
        )}
      </div>

      {/* Functionality tags */}
      {product.functionality_tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {product.functionality_tags.map((tag) => (
            <FunctionalityTag key={tag} tag={tag} size="md" />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={handleCompareToggle}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ${
            isInCompare
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-foreground hover:bg-muted'
          }`}
        >
          {isInCompare ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isInCompare ? '비교 목록에 있음' : '비교 담기'}
        </button>
        <button
          onClick={handleAddSupplement}
          className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Pill className="h-4 w-4" />
          내 영양제 등록
        </button>
        <button
          onClick={handleFavorite}
          className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Heart className="h-4 w-4" />
          즐겨찾기
        </button>
        <ShareButton />
      </div>

      {/* Details */}
      <div className="space-y-4 rounded-lg border border-border p-4">
        {product.primary_functionality && (
          <DetailRow label="주된 기능성" value={product.primary_functionality} />
        )}
        {product.how_to_take && (
          <DetailRow label="섭취방법" value={product.how_to_take} />
        )}
        {product.caution && (
          <DetailRow label="섭취 시 주의사항" value={product.caution} />
        )}
        {product.shape && (
          <DetailRow label="제품형태" value={product.shape} />
        )}
        {product.shelf_life && (
          <DetailRow label="소비기한" value={product.shelf_life} />
        )}
        {product.storage_method && (
          <DetailRow label="보관방법" value={product.storage_method} />
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-sm font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed">{value}</dd>
    </div>
  )
}
