'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IngredientTooltip } from './IngredientTooltip'
import { cn } from '@/lib/utils/cn'
import { Info } from 'lucide-react'

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
  rawMaterials?: string | null
}

export function IngredientList({ ingredients, rawMaterials }: IngredientListProps) {
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientItem | null>(null)

  const functionalIngredients = ingredients.filter((i) => i.is_functional)

  // Parse raw_materials string into individual items
  const rawMaterialItems = rawMaterials
    ? rawMaterials.split(',').map((s) => s.trim()).filter(Boolean)
    : []

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

      {/* Raw materials */}
      {rawMaterialItems.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            원재료
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {rawMaterialItems.map((item, i) => (
              <Link
                key={`raw-${i}`}
                href={`/products?q=${encodeURIComponent(item)}`}
                className="rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                {item}
              </Link>
            ))}
          </div>
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
