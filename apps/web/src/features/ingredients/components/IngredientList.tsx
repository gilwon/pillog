'use client'

import { useState } from 'react'
import { IngredientTooltip } from './IngredientTooltip'
import { cn } from '@/lib/utils/cn'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'

interface IngredientItem {
  id?: string
  ingredient_id?: string
  canonical_name: string
  description: string | null
  primary_effect: string | null
  amount: number | null
  amount_unit: string | null
  percentage_of_rdi: number | null
  daily_rdi: number | null
  daily_ul: number | null
  rdi_unit: string | null
  is_functional: boolean
  category: string
}

interface IngredientListProps {
  ingredients: IngredientItem[]
}

export function IngredientList({ ingredients }: IngredientListProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientItem | null>(null)

  const functionalIngredients = ingredients.filter((i) => i.is_functional)
  const otherIngredients = ingredients.filter((i) => !i.is_functional)
  const displayOthers = expanded
    ? otherIngredients
    : otherIngredients.slice(0, 5)

  return (
    <div>
      {/* Functional ingredients */}
      {functionalIngredients.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-primary">
            기능성 원료
          </h3>
          <div className="space-y-2">
            {functionalIngredients.map((ing, i) => (
              <IngredientRow
                key={`fn-${i}`}
                ingredient={ing}
                onSelect={() => setSelectedIngredient(ing)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other ingredients */}
      {otherIngredients.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            기타 원료
          </h3>
          <div className="space-y-2">
            {displayOthers.map((ing, i) => (
              <IngredientRow
                key={`other-${i}`}
                ingredient={ing}
                onSelect={() => setSelectedIngredient(ing)}
              />
            ))}
          </div>
          {otherIngredients.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {expanded ? (
                <>
                  접기 <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  {otherIngredients.length - 5}개 더 보기{' '}
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Tooltip overlay */}
      {selectedIngredient && (
        <IngredientTooltip
          ingredient={selectedIngredient}
          onClose={() => setSelectedIngredient(null)}
        />
      )}
    </div>
  )
}

function IngredientRow({
  ingredient,
  onSelect,
}: {
  ingredient: IngredientItem
  onSelect: () => void
}) {
  const rdiPct = ingredient.percentage_of_rdi

  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
      <div className="flex items-center gap-2">
        <button
          onClick={onSelect}
          className="text-muted-foreground hover:text-primary"
          title="성분 상세 보기"
        >
          <Info className="h-4 w-4" />
        </button>
        <div>
          <span className="text-sm font-medium">
            {ingredient.canonical_name}
          </span>
          {ingredient.description && (
            <p className="text-xs text-muted-foreground">
              {ingredient.description}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        {ingredient.amount != null && (
          <span className="text-sm font-medium">
            {ingredient.amount}
            {ingredient.amount_unit || ingredient.rdi_unit || 'mg'}
          </span>
        )}
        {rdiPct != null && (
          <span
            className={cn(
              'ml-2 text-xs',
              rdiPct > 300
                ? 'text-warning'
                : rdiPct > 150
                  ? 'text-caution'
                  : 'text-safe'
            )}
          >
            ({rdiPct}% RDI)
          </span>
        )}
      </div>
    </div>
  )
}
