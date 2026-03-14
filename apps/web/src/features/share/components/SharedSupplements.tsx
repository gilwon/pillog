import { Pill } from 'lucide-react'
import type { SupplementShareData } from '@/types/database'

interface SharedSupplementsProps {
  data: SupplementShareData
}

export function SharedSupplements({ data }: SharedSupplementsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pill className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">복용 중인 영양제</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {data.supplements.length}개
        </span>
      </div>

      <div className="space-y-3">
        {data.supplements.map((supp, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{supp.product_name}</p>
                <p className="text-sm text-muted-foreground">{supp.company}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                1일 {supp.daily_dose}회
              </span>
            </div>
            {supp.ingredients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {supp.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full bg-primary/5 px-2 py-0.5 text-xs text-primary"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
