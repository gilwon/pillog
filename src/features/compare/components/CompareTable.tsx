'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ProductCompareResponse } from '@/types/api'

async function fetchComparison(ids: string[]): Promise<ProductCompareResponse> {
  const res = await fetch(`/api/products/compare?ids=${ids.join(',')}`)
  if (!res.ok) throw new Error('Compare failed')
  return res.json()
}

interface CompareTableProps {
  productIds: string[]
}

export function CompareTable({ productIds }: CompareTableProps) {
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

  return (
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
              <th key={p.id} className="min-w-[120px] px-3 py-3 text-center font-medium">
                <div className="truncate">{p.name}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {p.company}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.comparison_table.map((row, i) => (
            <tr
              key={row.ingredient}
              className={cn(
                'border-b border-border last:border-0',
                i % 2 === 1 && 'bg-muted/20'
              )}
            >
              <td className="sticky left-0 bg-background px-4 py-3 font-medium">
                <div>{row.ingredient}</div>
                <div className="text-xs text-muted-foreground">
                  {row.category}
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
                return (
                  <td key={p.id} className="px-3 py-3 text-center">
                    {value ? (
                      <div>
                        <div className="font-medium">
                          {value.amount != null
                            ? `${value.amount}${row.unit || ''}`
                            : '-'}
                        </div>
                        {value.rdi_pct != null && (
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
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
