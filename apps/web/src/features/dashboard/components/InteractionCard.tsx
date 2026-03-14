import { ArrowLeftRight, Zap, ShieldAlert, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import type { InteractionWarning } from '@/types/database'

interface InteractionCardProps {
  interaction: InteractionWarning
}

const typeLabels: Record<InteractionWarning['type'], string> = {
  competition: '흡수 경쟁',
  interference: '작용 간섭',
  synergy: '시너지',
}

export function InteractionCard({ interaction }: InteractionCardProps) {
  const isSynergy = interaction.type === 'synergy'
  const isWarning = interaction.severity === 'warning'

  const Icon = isSynergy
    ? Zap
    : isWarning
      ? ShieldAlert
      : ArrowLeftRight

  const variant = isSynergy ? 'success' : isWarning ? 'warning' : 'caution'

  const badgeClass = isSynergy
    ? 'bg-safe/10 text-safe'
    : 'bg-caution/10 text-caution'

  return (
    <Alert variant={variant}>
      <Icon />
      <AlertTitle>
        <span className="flex items-center gap-2">
          {interaction.nutrients.join(' & ')}
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', badgeClass)}>
            {typeLabels[interaction.type]}
          </span>
        </span>
      </AlertTitle>
      <AlertDescription>
        {interaction.message}
        {interaction.recommendation && (
          <div className="mt-2 flex items-start gap-1.5 text-xs">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{interaction.recommendation}</span>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
