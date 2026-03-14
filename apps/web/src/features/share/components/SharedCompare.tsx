import { ScaleIcon } from 'lucide-react'
import type { CompareShareData } from '@/types/database'

interface SharedCompareProps {
  data: CompareShareData
}

export function SharedCompare({ data }: SharedCompareProps) {
  const productIds = data.products.map((p) => p.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScaleIcon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">제품 비교</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {data.products.length}개 제품
        </span>
      </div>

      {/* Product headers */}
      <div className="flex flex-wrap gap-2">
        {data.products.map((product) => (
          <div
            key={product.id}
            className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm"
          >
            <span className="font-medium">{product.name}</span>
            <span className="ml-1 text-muted-foreground">{product.company}</span>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      {data.comparison_table.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">성분</th>
                {data.products.map((p) => (
                  <th key={p.id} className="px-4 py-2 text-right font-medium">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.comparison_table.map((row) => (
                <tr key={row.ingredient} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    <span className="font-medium">{row.ingredient}</span>
                    {row.unit && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({row.unit})
                      </span>
                    )}
                  </td>
                  {productIds.map((pid) => {
                    const val = row.products[pid]
                    return (
                      <td key={pid} className="px-4 py-2 text-right">
                        {val?.amount != null ? (
                          <div>
                            <span>{val.amount}</span>
                            {val.rdi_pct != null && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({val.rdi_pct}%)
                              </span>
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
      )}
    </div>
  )
}
