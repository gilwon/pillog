'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

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
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-scale-in w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl border border-border/50">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{ingredient.canonical_name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {ingredient.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {ingredient.description && (
          <div className="mb-4">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              쉬운 설명
            </h4>
            <p className="text-sm leading-relaxed">{ingredient.description}</p>
          </div>
        )}

        {ingredient.primary_effect && (
          <div className="mb-4">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              주요 효과
            </h4>
            <p className="text-sm">{ingredient.primary_effect}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {ingredient.daily_rdi != null && (
            <div className="rounded-xl bg-safe/10 p-3">
              <p className="text-xs text-muted-foreground">1일 권장량 (RDI)</p>
              <p className="mt-1 text-lg font-bold text-safe">
                {ingredient.daily_rdi}
                <span className="text-sm font-normal">
                  {ingredient.rdi_unit || 'mg'}
                </span>
              </p>
            </div>
          )}
          {ingredient.daily_ul != null && (
            <div className="rounded-xl bg-warning/10 p-3">
              <p className="text-xs text-muted-foreground">1일 상한량 (UL)</p>
              <p className="mt-1 text-lg font-bold text-warning">
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
          className="mt-5 w-full rounded-xl bg-muted py-2.5 text-sm font-medium transition-colors hover:bg-muted/70"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
