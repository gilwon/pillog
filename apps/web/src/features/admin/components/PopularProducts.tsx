import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import type { AdminStatsResponse } from '@/types/api'

interface Props {
  data: AdminStatsResponse['popular_products']
}

export function PopularProducts({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            인기 제품
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          인기 제품 TOP 10
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-sm font-medium hover:text-primary truncate block"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">{product.company}</p>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {product.user_count.toLocaleString()}명
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
