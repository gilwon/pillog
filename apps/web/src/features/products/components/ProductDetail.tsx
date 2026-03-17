'use client'

import { FunctionalityTag } from '@/components/common/FunctionalityTag'
import { ShareButton } from '@/components/common/ShareButton'
import { Alert, AlertDescription, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCompareStore } from '@/features/compare/store/compare-store'
import { useProductActions } from '@/features/products/hooks/useProductActions'
import { Plus, Check, Heart, Pill, CheckCircle2, AlertCircle, X, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ProductWithIngredients } from '@/types/database'

interface ProductDetailProps {
  product: ProductWithIngredients
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter()
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
    <div className="animate-fade-in-up">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 -ml-2 gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </Button>

      {/* Header */}
      <div className="mb-6">
        <p className="mb-1.5 text-sm font-medium text-muted-foreground">{product.company}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{product.name}</h1>
        {product.report_no && (
          <p className="mt-1.5 text-xs text-muted-foreground/70">
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
        <Button
          variant={isInCompare ? 'default' : 'outline'}
          size="sm"
          onClick={handleCompareToggle}
          className="gap-1.5"
        >
          {isInCompare ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isInCompare ? '비교 목록에 있음' : '비교 담기'}
        </Button>

        <Button
          variant={isSupplement ? 'default' : 'outline'}
          size="sm"
          onClick={addSupplement}
          disabled={isSupplement}
          className="gap-1.5"
        >
          {isSupplement ? <Check className="h-4 w-4" /> : <Pill className="h-4 w-4" />}
          {isSupplement ? '내 영양제 등록됨' : '내 영양제 등록'}
        </Button>

        <Button
          variant={isFavorite ? 'default' : 'outline'}
          size="sm"
          onClick={addFavorite}
          disabled={isFavorite}
          className="gap-1.5"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          {isFavorite ? '즐겨찾기 등록됨' : '즐겨찾기'}
        </Button>

        <ShareButton />
      </div>

      {/* Notification */}
      {notification && (
        <div className="mb-6 animate-fade-in">
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
      <div className="rounded-xl border border-border bg-card p-5">
        <dl className="divide-y divide-border/60">
          {product.primary_functionality && (
            <DetailRow label="주된 기능성" value={product.primary_functionality} isFirst />
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
        </dl>
      </div>
    </div>
  )
}

function DetailRow({ label, value, isFirst }: { label: string; value: string; isFirst?: boolean }) {
  return (
    <div className={isFirst ? 'pb-3' : 'py-3'}>
      <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{label}</dt>
      <dd className="text-sm leading-relaxed">{value}</dd>
    </div>
  )
}
