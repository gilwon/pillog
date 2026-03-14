import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import type { DashboardWarning } from '@/types/database'

interface WarningCardProps {
  warning: DashboardWarning
}

export function WarningCard({ warning }: WarningCardProps) {
  const variant =
    warning.severity === 'warning'
      ? 'warning'
      : warning.severity === 'caution'
        ? 'caution'
        : 'info'

  const Icon =
    warning.severity === 'warning'
      ? AlertTriangle
      : warning.severity === 'caution'
        ? AlertCircle
        : Info

  return (
    <Alert variant={variant}>
      <Icon />
      <AlertTitle>
        {warning.ingredient}
        {warning.rdi != null && warning.unit != null && (
          <span className="ml-1.5 font-normal text-muted-foreground">
            (일일권장량 RDI: {warning.rdi.toLocaleString()}{warning.unit})
          </span>
        )}
      </AlertTitle>
      <AlertDescription>
        {warning.message.replace(/(\d+)/g, (_, n) => Number(n).toLocaleString())}
      </AlertDescription>
    </Alert>
  )
}
