'use client'

import { useIntakeToday } from '@/features/dashboard/hooks/useIntakeToday'
import { Loader2, CheckCircle2, Circle, Pill } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function IntakeChecklist() {
  const { data, isLoading, error, toggle, isToggling } = useIntakeToday()

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border p-6">
        <p className="text-sm text-destructive">
          복용 체크리스트를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    )
  }

  if (!data || data.total_count === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <Pill className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          등록된 영양제가 없습니다. 내 영양제를 먼저 등록해주세요.
        </p>
      </div>
    )
  }

  const allTaken = data.taken_count === data.total_count

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">오늘 복용 체크</h2>
        <span
          className={cn(
            'text-sm font-medium',
            allTaken ? 'text-green-600' : 'text-muted-foreground'
          )}
        >
          {data.taken_count}/{data.total_count} 완료
        </span>
      </div>

      <div className="space-y-2">
        {data.supplements.map((item) => (
          <button
            key={item.product_id}
            onClick={() => toggle(item.product_id, item.is_taken)}
            disabled={isToggling}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
              item.is_taken
                ? 'bg-green-50 dark:bg-green-950/20'
                : 'hover:bg-muted/50'
            )}
          >
            {item.is_taken ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  item.is_taken && 'text-green-700 line-through dark:text-green-400'
                )}
              >
                {item.product_name}
              </span>
              {item.ingredients.length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.ingredients
                    .map((ing) =>
                      ing.amount && ing.unit
                        ? `${ing.name} ${ing.amount.toLocaleString()}${ing.unit}`
                        : ing.name
                    )
                    .join(' · ')}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {allTaken && (
        <p className="mt-3 text-center text-sm font-medium text-green-600">
          오늘의 영양제를 모두 복용했습니다!
        </p>
      )}
    </div>
  )
}
