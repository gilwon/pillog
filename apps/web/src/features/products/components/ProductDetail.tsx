'use client'

import { FunctionalityTag } from '@/components/common/FunctionalityTag'
import { ShareButton } from '@/components/common/ShareButton'
import { Alert, AlertDescription, AlertAction } from '@/components/ui/alert'
import { useCompareStore } from '@/features/compare/store/compare-store'
import { useProductActions } from '@/features/products/hooks/useProductActions'
import { Plus, Check, Heart, Pill, CheckCircle2, AlertCircle, X } from 'lucide-react'
import type { ProductWithIngredients } from '@/types/database'

interface ProductDetailProps {
  product: ProductWithIngredients
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { items, addItem, removeItem } = useCompareStore()
  const {
    addSupplement,
    addFavorite,
    isSupplement,
    isFavorite,
    notification,
    clearNotification,
  } = useProductActions(product.id)
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
          {product.functionality_tags.map((tag, index) => (
            <FunctionalityTag key={`${tag}-${index}`} tag={tag} size="md" />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={handleCompareToggle}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ${
            isInCompare
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-foreground hover:bg-muted'
          }`}
        >
          {isInCompare ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isInCompare ? '비교 목록에 있음' : '비교 담기'}
        </button>

        <button
          onClick={addSupplement}
          disabled={isSupplement}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ${
            isSupplement
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-foreground hover:bg-muted'
          }`}
        >
          {isSupplement ? <Check className="h-4 w-4" /> : <Pill className="h-4 w-4" />}
          {isSupplement ? '내 영양제 등록됨' : '내 영양제 등록'}
        </button>

        <button
          onClick={addFavorite}
          disabled={isFavorite}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ${
            isFavorite
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-foreground hover:bg-muted'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          {isFavorite ? '즐겨찾기 등록됨' : '즐겨찾기'}
        </button>

        <ShareButton />
      </div>

      {/* Notification */}
      {notification && (
        <div className="mb-6">
          <Alert variant={notification.variant}>
            {notification.variant === 'success' ? (
              <CheckCircle2 />
            ) : (
              <AlertCircle />
            )}
            <AlertDescription>{notification.message}</AlertDescription>
            <AlertAction>
              <button
                onClick={clearNotification}
                className="rounded p-0.5 opacity-70 hover:opacity-100"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </AlertAction>
          </Alert>
        </div>
      )}

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
      <dt className="mb-1 text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-relaxed">{value}</dd>
    </div>
  )
}
