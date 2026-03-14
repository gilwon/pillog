'use client'

import { cn } from '@/lib/utils'
import type { HealthConcern } from '../types'

interface HealthConcernCardProps {
  concern: HealthConcern
  selected: boolean
  disabled: boolean
  onToggle: () => void
}

export function HealthConcernCard({
  concern,
  selected,
  disabled,
  onToggle,
}: HealthConcernCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      aria-pressed={selected}
      aria-label={`${concern.label} ${selected ? '선택됨' : '선택 안됨'}`}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
        'hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'border-primary bg-primary/10 text-primary shadow-sm'
          : 'border-border bg-card text-foreground',
        disabled && !selected && 'cursor-not-allowed opacity-40'
      )}
    >
      <span className="text-2xl" role="img" aria-hidden>
        {concern.emoji}
      </span>
      <span className="text-sm font-semibold">{concern.label}</span>
      <span className="text-xs text-muted-foreground">{concern.description}</span>
    </button>
  )
}
