'use client'

import { useState, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { ProductCompareResponse, ComparisonItem } from '@/types/api'

const PRODUCT_COLORS = [
  { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-500/30' },
  { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', border: 'border-violet-500/30' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-500/30' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
] as const

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

/** 성분이 포함된 제품 수를 반환 */
function getContainingProductCount(row: ComparisonItem): number {
  return Object.values(row.products).filter((v) => v.amount != null).length
}

interface ProductSummary {
  productId: string
  name: string
  ingredientCount: number
  uniqueCount: number
  rdiMetCount: number
  overUlCount: number
}

function CompareSummaryCards({
  data,
  colorMap,
}: {
  data: ProductCompareResponse
  colorMap: Map<string, (typeof PRODUCT_COLORS)[number]>
}) {
  const summaries: ProductSummary[] = data.products.map((p) => {
    const myRows = data.comparison_table.filter(
      (r) => r.products[p.id]?.amount != null
    )
    const uniqueRows = myRows.filter(
      (r) => getContainingProductCount(r) === 1
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
      uniqueCount: uniqueRows.length,
      rdiMetCount: rdiMet.length,
      overUlCount: overUl.length,
    }
  })

  const maxIngredients = Math.max(...summaries.map((s) => s.ingredientCount))
  const maxRdiMet = Math.max(...summaries.map((s) => s.rdiMetCount))

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {summaries.map((s) => {
        const color = colorMap.get(s.productId)
        return (
          <div
            key={s.productId}
            className={cn(
              'rounded-lg border p-3 text-sm',
              color?.border || 'border-border',
              color?.bg || 'bg-muted/20'
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', color?.dot)}
              />
              <p className="truncate font-medium">{s.name}</p>
            </div>
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
              {s.uniqueCount > 0 && (
                <div className="flex items-center justify-between">
                  <span>고유 성분</span>
                  <span className={cn('font-medium', color?.text)}>
                    {s.uniqueCount}개
                  </span>
                </div>
              )}
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
        )
      })}
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

  // 제품별 색상 매핑
  const colorMap = new Map<string, (typeof PRODUCT_COLORS)[number]>()
  data.products.forEach((p, i) => {
    colorMap.set(p.id, PRODUCT_COLORS[i % PRODUCT_COLORS.length])
  })

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

  // 공통/고유 성분 통계
  const commonCount = data.comparison_table.filter(
    (r) => getContainingProductCount(r) === data.products.length
  ).length
  const totalCount = data.comparison_table.length

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
    <div className="space-y-4">
      {/* 요약 카드 (테이블 위) */}
      <CompareSummaryCards data={data} colorMap={colorMap} />

      {/* 공통/전체 성분 통계 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>전체 성분 <strong className="text-foreground">{totalCount}</strong>개</span>
        <span className="text-border">|</span>
        <span>공통 성분 <strong className="text-foreground">{commonCount}</strong>개</span>
        <span className="text-border">|</span>
        <span>차이 성분 <strong className="text-foreground">{totalCount - commonCount}</strong>개</span>
      </div>

      {/* 비교 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium">
                성분
              </th>
              <th className="px-3 py-3 text-center font-medium text-muted-foreground">
                RDI
              </th>
              <th className="px-3 py-3 text-center font-medium text-muted-foreground">
                UL
              </th>
              {data.products.map((p) => {
                const color = colorMap.get(p.id)!
                return (
                  <th
                    key={p.id}
                    className={cn(
                      'min-w-[130px] border-l px-3 py-3 text-center font-medium',
                      color.bg,
                      color.border
                    )}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', color.dot)} />
                      <Link
                        href={`/products/${p.id}`}
                        className="truncate hover:text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {p.company}
                    </div>
                  </th>
                )
              })}
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
                      const containCount = getContainingProductCount(row)
                      const isUnique = containCount === 1
                      return (
                        <tr
                          key={row.ingredient}
                          className={cn(
                            'border-b border-border last:border-0',
                            i % 2 === 1 && 'bg-muted/20'
                          )}
                        >
                          <td className="sticky left-0 z-10 bg-background px-4 py-3 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span>{row.ingredient}</span>
                              {isUnique && (
                                <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                                  고유
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground">
                            {row.rdi != null ? `${row.rdi}${row.unit || ''}` : '-'}
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground">
                            {row.ul != null ? `${row.ul}${row.unit || ''}` : '-'}
                          </td>
                          {data.products.map((p) => {
                            const value = row.products[p.id]
                            const hasAmount = value?.amount != null
                            const isMax = maxPid === p.id && hasAmount
                            const color = colorMap.get(p.id)!
                            return (
                              <td
                                key={p.id}
                                className={cn(
                                  'border-l px-3 py-3 text-center',
                                  color.border,
                                  isMax && 'bg-safe/10 ring-1 ring-inset ring-safe/20',
                                )}
                              >
                                {hasAmount ? (
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
                                  <span className="text-xs text-muted-foreground/50">미포함</span>
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
    </div>
  )
}
