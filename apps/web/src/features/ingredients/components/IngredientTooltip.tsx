'use client'

import { X } from 'lucide-react'

interface IngredientTooltipProps {
  ingredient: {
    canonical_name: string
    category: string
    description: string | null
    primary_effect: string | null
    daily_rdi: number | null
    daily_ul: number | null
    rdi_unit: string | null
    amount: number | null
    amount_unit: string | null
  }
  onClose: () => void
}

export function IngredientTooltip({
  ingredient,
  onClose,
}: IngredientTooltipProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{ingredient.canonical_name}</h3>
            <p className="text-sm text-muted-foreground">
              {ingredient.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {ingredient.description && (
          <div className="mb-4">
            <h4 className="mb-1 text-sm font-medium text-muted-foreground">
              쉬운 설명
            </h4>
            <p className="text-sm leading-relaxed">{ingredient.description}</p>
          </div>
        )}

        {ingredient.primary_effect && (
          <div className="mb-4">
            <h4 className="mb-1 text-sm font-medium text-muted-foreground">
              주요 효과
            </h4>
            <p className="text-sm">{ingredient.primary_effect}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {ingredient.daily_rdi != null && (
            <div className="rounded-md bg-safe/10 p-3">
              <p className="text-xs text-muted-foreground">1일 권장량 (RDI)</p>
              <p className="text-lg font-bold text-safe">
                {ingredient.daily_rdi}
                <span className="text-sm font-normal">
                  {ingredient.rdi_unit || 'mg'}
                </span>
              </p>
            </div>
          )}
          {ingredient.daily_ul != null && (
            <div className="rounded-md bg-warning/10 p-3">
              <p className="text-xs text-muted-foreground">1일 상한량 (UL)</p>
              <p className="text-lg font-bold text-warning">
                {ingredient.daily_ul}
                <span className="text-sm font-normal">
                  {ingredient.rdi_unit || 'mg'}
                </span>
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-md bg-muted py-2.5 text-sm font-medium hover:bg-muted/80"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
