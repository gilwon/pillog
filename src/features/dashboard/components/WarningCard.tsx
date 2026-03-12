import { AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DashboardWarning } from '@/types/database'

interface WarningCardProps {
  warning: DashboardWarning
}

export function WarningCard({ warning }: WarningCardProps) {
  const isWarning = warning.severity === 'warning'
  const Icon = isWarning ? AlertTriangle : AlertCircle

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        isWarning
          ? 'border-warning/30 bg-warning/5'
          : 'border-caution/30 bg-caution/5'
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0',
          isWarning ? 'text-warning' : 'text-caution'
        )}
      />
      <div>
        <p
          className={cn(
            'text-sm font-semibold',
            isWarning ? 'text-warning' : 'text-caution'
          )}
        >
          {warning.ingredient}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{warning.message}</p>
      </div>
    </div>
  )
}
