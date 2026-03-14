'use client'

import { useState, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { ProductCompareResponse, ComparisonItem } from '@/types/api'

async function fetchComparison(ids: string[]): Promise<ProductCompareResponse> {
  const res = await fetch(`/api/products/compare?ids=${ids.join(',')}`)
  if (!res.ok) throw new Error('Compare failed')
  return res.json()
}

function getMaxProductId(row: ComparisonItem): string | null {
  let maxId: string | null = null
  let maxVal = -Infinity
  for (const [pid, val] of Object.entries(row.products)) {
    if (val.amount != null && val.amount > maxVal) {
      maxVal = val.amount
      maxId = pid
    }
  }
  return maxVal === -Infinity ? null : maxId
}

function RdiBar({ rdiPct }: { rdiPct: number }) {
  const barWidth = Math.min(rdiPct, 100)
  const barColor =
    rdiPct > 300 ? 'bg-warning' : rdiPct > 150 ? 'bg-caution' : 'bg-safe'
  return (
    <div className="mt-1 h-1 w-full rounded-full bg-muted">
      <div
        className={cn('h-1 rounded-full transition-all', barColor)}
        style={{ width: `${barWidth}%` }}
      />
    </div>
  )
}

interface ProductSummary {
  productId: string
  name: string
  ingredientCount: number
  rdiMetCount: number
  overUlCount: number
}

function CompareSummaryCards({ data }: { data: ProductCompareResponse }) {
  const summaries: ProductSummary[] = data.products.map((p) => {
    const myRows = data.comparison_table.filter(
      (r) => r.products[p.id]?.amount != null
    )
    const rdiMet = myRows.filter(
      (r) => r.products[p.id]?.rdi_pct != null && (r.products[p.id]?.rdi_pct ?? 0) >= 50
    )
    const overUl = myRows.filter((r) => {
      const val = r.products[p.id]?.amount
      return val != null && r.ul != null && val > r.ul
    })
    return {
      productId: p.id,
      name: p.name,
      ingredientCount: myRows.length,
      rdiMetCount: rdiMet.length,
      overUlCount: overUl.length,
    }
  })

  const maxIngredients = Math.max(...summaries.map((s) => s.ingredientCount))
  const maxRdiMet = Math.max(...summaries.map((s) => s.rdiMetCount))

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {summaries.map((s) => (
        <div
          key={s.productId}
          className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
        >
          <p className="mb-2 truncate font-medium">{s.name}</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>포함 성분</span>
              <span
                className={cn(
                  'font-medium',
                  s.ingredientCount === maxIngredients && 'text-safe'
                )}
              >
                {s.ingredientCount}개
                {s.ingredientCount === maxIngredients && summaries.length > 1 && (
                  <span className="ml-1 text-[10px]">★</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>RDI 50% 이상</span>
              <span
                className={cn(
                  'font-medium',
                  s.rdiMetCount === maxRdiMet && 'text-safe'
                )}
              >
                {s.rdiMetCount}개
                {s.rdiMetCount === maxRdiMet && summaries.length > 1 && (
                  <span className="ml-1 text-[10px]">★</span>
                )}
              </span>
            </div>
            {s.overUlCount > 0 && (
              <div className="flex items-center justify-between">
                <span>UL 초과</span>
                <span className="font-medium text-warning">{s.overUlCount}개</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

interface CompareTableProps {
  productIds: string[]
}

export function CompareTable({ productIds }: CompareTableProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['compare', productIds.join(',')],
    queryFn: () => fetchComparison(productIds),
    enabled: productIds.length >= 2,
  })

  if (productIds.length < 2) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        비교하려면 최소 2개 제품을 선택해주세요.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="py-8 text-center text-destructive">
        비교 데이터를 불러오는 중 오류가 발생했습니다.
      </p>
    )
  }

  if (data.comparison_table.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        비교할 성분 데이터가 없습니다.
      </p>
    )
  }

  // Group by category
  const grouped = data.comparison_table.reduce<Record<string, ComparisonItem[]>>(
    (acc, row) => {
      const key = row.category || '기타'
      if (!acc[key]) acc[key] = []
      acc[key].push(row)
      return acc
    },
    {}
  )
  const categories = Object.keys(grouped).sort()

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 bg-muted/50 px-4 py-3 text-left font-medium">
                성분
              </th>
              <th className="px-3 py-3 text-center font-medium text-muted-foreground">
                RDI
              </th>
              <th className="px-3 py-3 text-center font-medium text-muted-foreground">
                UL
              </th>
              {data.products.map((p) => (
                <th
                  key={p.id}
                  className="min-w-[130px] px-3 py-3 text-center font-medium"
                >
                  <Link
                    href={`/products/${p.id}`}
                    className="truncate hover:text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                  <div className="text-xs font-normal text-muted-foreground">
                    {p.company}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const rows = grouped[category]
              const isCollapsed = collapsedCategories.has(category)
              return (
                <Fragment key={category}>
                  {/* Category header row */}
                  <tr
                    key={`cat-${category}`}
                    className="cursor-pointer border-b border-border bg-muted/40 hover:bg-muted/60"
                    onClick={() => toggleCategory(category)}
                  >
                    <td
                      colSpan={3 + data.products.length}
                      className="px-4 py-2"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        {category}
                        <span className="font-normal">({rows.length})</span>
                      </div>
                    </td>
                  </tr>

                  {/* Ingredient rows */}
                  {!isCollapsed &&
                    rows.map((row, i) => {
                      const maxPid = getMaxProductId(row)
                      return (
                        <tr
                          key={row.ingredient}
                          className={cn(
                            'border-b border-border last:border-0',
                            i % 2 === 1 && 'bg-muted/20'
                          )}
                        >
                          <td className="sticky left-0 bg-background px-4 py-3 font-medium">
                            {row.ingredient}
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground">
                            {row.rdi != null ? `${row.rdi}${row.unit || ''}` : '-'}
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground">
                            {row.ul != null ? `${row.ul}${row.unit || ''}` : '-'}
                          </td>
                          {data.products.map((p) => {
                            const value = row.products[p.id]
                            const isMax = maxPid === p.id && value?.amount != null
                            return (
                              <td
                                key={p.id}
                                className={cn(
                                  'px-3 py-3 text-center',
                                  isMax && 'bg-safe/10 ring-1 ring-inset ring-safe/20'
                                )}
                              >
                                {value?.amount != null ? (
                                  <div>
                                    <div className={cn('font-medium', isMax && 'text-safe')}>
                                      {value.amount}
                                      {row.unit || ''}
                                    </div>
                                    {value.rdi_pct != null && (
                                      <>
                                        <div
                                          className={cn(
                                            'text-xs',
                                            value.rdi_pct > 300
                                              ? 'text-warning'
                                              : value.rdi_pct > 150
                                                ? 'text-caution'
                                                : 'text-safe'
                                          )}
                                        >
                                          RDI {value.rdi_pct}%
                                        </div>
                                        <RdiBar rdiPct={value.rdi_pct} />
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <CompareSummaryCards data={data} />
    </div>
  )
}
