'use client'

import { useState, useMemo, useRef, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, ChevronDown, ChevronRight, ArrowUpDown, Filter, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { ProductCompareResponse, ComparisonItem } from '@/types/api'

const PRODUCT_COLORS = [
  { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-500/30' },
  { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', border: 'border-violet-500/30' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-500/30' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
] as const

type FilterType = 'all' | 'common' | 'diff' | string // string = product id for unique
type SortType = 'category' | 'name' | 'rdi'

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

function getMaxRdiPct(row: ComparisonItem): number {
  let max = 0
  for (const val of Object.values(row.products)) {
    if (val.rdi_pct != null && val.rdi_pct > max) max = val.rdi_pct
  }
  return max
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

function getContainingProductCount(row: ComparisonItem): number {
  return Object.values(row.products).filter((v) => v.included).length
}

/** 특정 성분이 어느 제품에만 있는지 (고유 성분인 경우 product id 반환) */
function getUniqueProductId(row: ComparisonItem): string | null {
  const entries = Object.entries(row.products).filter(([, v]) => v.included)
  return entries.length === 1 ? entries[0][0] : null
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
  onReorder,
}: {
  data: ProductCompareResponse
  colorMap: Map<string, (typeof PRODUCT_COLORS)[number]>
  onReorder?: (fromIndex: number, toIndex: number) => void
}) {
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const summaries: ProductSummary[] = data.products.map((p) => {
    const myRows = data.comparison_table.filter(
      (r) => r.products[p.id]?.included
    )
    const uniqueRows = myRows.filter(
      (r) => getContainingProductCount(r) === 1
    )
    const rdiMet = myRows.filter((r) => {
      const val = r.products[p.id]
      if (!val) return false
      // rdi_pct가 있으면 사용, 없으면 amount/rdi로 직접 계산
      const pct = val.rdi_pct ?? (val.amount != null && r.rdi != null && r.rdi > 0 ? (val.amount / r.rdi) * 100 : null)
      return pct != null && pct >= 50
    })
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
      {summaries.map((s, index) => {
        const color = colorMap.get(s.productId)
        return (
          <div
            key={s.productId}
            draggable={!!onReorder}
            onDragStart={() => { dragItem.current = index }}
            onDragOver={(e) => { e.preventDefault(); dragOverItem.current = index }}
            onDrop={() => {
              if (onReorder && dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
                onReorder(dragItem.current, dragOverItem.current)
              }
              dragItem.current = null
              dragOverItem.current = null
            }}
            className={cn(
              'group rounded-lg border p-3 text-sm transition-all',
              onReorder && 'cursor-grab active:cursor-grabbing',
              color?.border || 'border-border',
              color?.bg || 'bg-muted/20'
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              {onReorder && (
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
              )}
              <span
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', color?.dot)}
              />
              <Link href={`/products/${s.productId}`} className="truncate font-medium hover:text-primary hover:underline">
                {s.name}
              </Link>
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

/* ─── 모바일 카드 뷰 ─── */

function MobileCardView({
  rows,
  products,
  colorMap,
}: {
  rows: ComparisonItem[]
  products: ProductCompareResponse['products']
  colorMap: Map<string, (typeof PRODUCT_COLORS)[number]>
}) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row) => {
        const maxPid = getMaxProductId(row)
        const uniquePid = getUniqueProductId(row)
        return (
          <div
            key={row.ingredient}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{row.ingredient}</span>
                {uniquePid && (
                  <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                    고유
                  </span>
                )}
              </div>
              {row.rdi != null && (
                <span className="text-xs text-muted-foreground">
                  RDI {row.rdi}{row.unit || ''}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {products.map((p) => {
                const value = row.products[p.id]
                const isIncluded = value?.included
                const hasAmount = value?.amount != null
                const isMax = maxPid === p.id && hasAmount
                const color = colorMap.get(p.id)!
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2.5 py-1.5',
                      isIncluded ? color.bg : 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', color.dot)} />
                      <span className="truncate text-xs">{p.name}</span>
                    </div>
                    {hasAmount ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('text-sm font-medium', isMax && 'text-safe')}>
                          {value.amount}{row.unit || ''}
                        </span>
                        {value.rdi_pct != null && (
                          <span
                            className={cn(
                              'text-xs',
                              value.rdi_pct > 300
                                ? 'text-warning'
                                : value.rdi_pct > 150
                                  ? 'text-caution'
                                  : 'text-safe'
                            )}
                          >
                            {value.rdi_pct}%
                          </span>
                        )}
                      </div>
                    ) : isIncluded ? (
                      <span className="text-xs text-muted-foreground">포함</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">미포함</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── 데스크톱 테이블 뷰 ─── */

function DesktopTableView({
  rows,
  categories,
  grouped,
  products,
  colorMap,
  collapsedCategories,
  toggleCategory,
}: {
  rows: ComparisonItem[]
  categories: string[]
  grouped: Record<string, ComparisonItem[]>
  products: ProductCompareResponse['products']
  colorMap: Map<string, (typeof PRODUCT_COLORS)[number]>
  collapsedCategories: Set<string>
  toggleCategory: (category: string) => void
}) {
  // 정렬된 rows로 grouped 재구성 (필터/정렬 적용된 rows 기반)
  const filteredGrouped = useMemo(() => {
    const rowSet = new Set(rows)
    const result: Record<string, ComparisonItem[]> = {}
    for (const cat of categories) {
      const catRows = (grouped[cat] || []).filter((r) => rowSet.has(r))
      if (catRows.length > 0) result[cat] = catRows
    }
    return result
  }, [rows, categories, grouped])

  const filteredCategories = Object.keys(filteredGrouped).sort()

  return (
    <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
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
            {products.map((p) => {
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
          {filteredCategories.map((category) => {
            const catRows = filteredGrouped[category]
            const isCollapsed = collapsedCategories.has(category)
            return (
              <Fragment key={category}>
                <tr
                  className="cursor-pointer border-b border-border bg-muted/40 hover:bg-muted/60"
                  onClick={() => toggleCategory(category)}
                >
                  <td colSpan={3 + products.length} className="px-4 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      {category}
                      <span className="font-normal">({catRows.length})</span>
                    </div>
                  </td>
                </tr>

                {!isCollapsed &&
                  catRows.map((row, i) => {
                    const maxPid = getMaxProductId(row)
                    const isUnique = getContainingProductCount(row) === 1
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
                        {products.map((p) => {
                          const value = row.products[p.id]
                          const isIncluded = value?.included
                          const hasAmount = value?.amount != null
                          const isMax = maxPid === p.id && hasAmount
                          const color = colorMap.get(p.id)!
                          return (
                            <td
                              key={p.id}
                              className={cn(
                                'border-l px-3 py-3 text-center',
                                color.border,
                                isMax && 'bg-safe/10 ring-1 ring-inset ring-safe/20'
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
                              ) : isIncluded ? (
                                <span className="text-xs text-muted-foreground">포함</span>
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
  )
}

/* ─── 메인 컴포넌트 ─── */

interface CompareTableProps {
  productIds: string[]
  onReorder?: (fromIndex: number, toIndex: number) => void
}

export function CompareTable({ productIds, onReorder }: CompareTableProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('category')

  const { data, isLoading, error } = useQuery({
    queryKey: ['compare', productIds.join(',')],
    queryFn: () => fetchComparison(productIds),
    enabled: productIds.length >= 2,
  })

  // 제품별 색상 매핑
  const colorMap = useMemo(() => {
    const map = new Map<string, (typeof PRODUCT_COLORS)[number]>()
    data?.products.forEach((p, i) => {
      map.set(p.id, PRODUCT_COLORS[i % PRODUCT_COLORS.length])
    })
    return map
  }, [data?.products])

  // 필터 + 정렬 적용
  const { filteredRows, grouped, categories } = useMemo(() => {
    if (!data) return { filteredRows: [], grouped: {} as Record<string, ComparisonItem[]>, categories: [] }

    const totalProducts = data.products.length

    // 필터
    let rows = data.comparison_table
    if (filter === 'common') {
      rows = rows.filter((r) => getContainingProductCount(r) === totalProducts)
    } else if (filter === 'diff') {
      rows = rows.filter((r) => getContainingProductCount(r) < totalProducts)
    } else if (filter !== 'all') {
      // 특정 제품 고유 성분
      rows = rows.filter((r) => {
        const uniquePid = getUniqueProductId(r)
        return uniquePid === filter
      })
    }

    // 정렬
    const sorted = [...rows]
    if (sort === 'name') {
      sorted.sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'ko'))
    } else if (sort === 'rdi') {
      sorted.sort((a, b) => getMaxRdiPct(b) - getMaxRdiPct(a))
    } else {
      sorted.sort((a, b) => {
        const catCmp = (a.category || '기타').localeCompare(b.category || '기타', 'ko')
        if (catCmp !== 0) return catCmp
        return a.ingredient.localeCompare(b.ingredient, 'ko')
      })
    }

    // 카테고리 그룹핑
    const g = sorted.reduce<Record<string, ComparisonItem[]>>((acc, row) => {
      const key = row.category || '기타'
      if (!acc[key]) acc[key] = []
      acc[key].push(row)
      return acc
    }, {})

    return { filteredRows: sorted, grouped: g, categories: Object.keys(g).sort() }
  }, [data, filter, sort])

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

  const totalCount = data.comparison_table.length
  const commonCount = data.comparison_table.filter(
    (r) => getContainingProductCount(r) === data.products.length
  ).length

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <CompareSummaryCards data={data} colorMap={colorMap} onReorder={onReorder} />

      {/* 통계 + 필터/정렬 컨트롤 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>전체 <strong className="text-foreground">{totalCount}</strong></span>
          <span className="text-border">|</span>
          <span>공통 <strong className="text-foreground">{commonCount}</strong></span>
          <span className="text-border">|</span>
          <span>차이 <strong className="text-foreground">{totalCount - commonCount}</strong></span>
          {filter !== 'all' && (
            <>
              <span className="text-border">|</span>
              <span>표시 <strong className="text-primary">{filteredRows.length}</strong></span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 필터 */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-background pl-7 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">전체 성분</option>
              <option value="common">공통 성분만</option>
              <option value="diff">차이 성분만</option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} 고유
                </option>
              ))}
            </select>
          </div>

          {/* 정렬 */}
          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="h-8 rounded-md border border-border bg-background pl-7 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="category">카테고리순</option>
              <option value="name">성분명순</option>
              <option value="rdi">RDI% 높은순</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          해당 조건의 성분이 없습니다.
        </p>
      ) : (
        <>
          {/* 모바일: 카드 뷰 */}
          <MobileCardView
            rows={filteredRows}
            products={data.products}
            colorMap={colorMap}
          />

          {/* 데스크톱: 테이블 뷰 */}
          <DesktopTableView
            rows={filteredRows}
            categories={categories}
            grouped={grouped}
            products={data.products}
            colorMap={colorMap}
            collapsedCategories={collapsedCategories}
            toggleCategory={toggleCategory}
          />
        </>
      )}
    </div>
  )
}
