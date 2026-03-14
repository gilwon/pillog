'use client'

import { HEALTH_CONCERNS, MAX_CONCERNS } from '../constants/health-concerns'
import { HealthConcernCard } from './HealthConcernCard'
import type { HealthConcernKey } from '../types'

interface HealthConcernSelectorProps {
  selected: HealthConcernKey[]
  onToggle: (key: HealthConcernKey) => void
}

export function HealthConcernSelector({ selected, onToggle }: HealthConcernSelectorProps) {
  const isMaxed = selected.length >= MAX_CONCERNS

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">어떤 건강 고민이 있으신가요?</h2>
        <span className="text-sm text-muted-foreground">
          {selected.length} / {MAX_CONCERNS} 선택
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {HEALTH_CONCERNS.map((concern) => (
          <HealthConcernCard
            key={concern.key}
            concern={concern}
            selected={selected.includes(concern.key)}
            disabled={isMaxed}
            onToggle={() => onToggle(concern.key)}
          />
        ))}
      </div>
    </div>
  )
}
