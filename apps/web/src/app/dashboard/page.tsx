'use client'

import { useQuery } from '@tanstack/react-query'
import { NutrientChart } from '@/features/dashboard/components/NutrientChart'
import { WarningCard } from '@/features/dashboard/components/WarningCard'
import { InteractionCard } from '@/features/dashboard/components/InteractionCard'
import { IntakeChecklist } from '@/features/dashboard/components/IntakeChecklist'
import { IntakeCalendar } from '@/features/dashboard/components/IntakeCalendar'
import { Loader2, BarChart3 } from 'lucide-react'
import type { DashboardResponse } from '@/types/api'

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch('/api/my/dashboard')
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  return res.json()
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-destructive">
          대시보드를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    )
  }

  if (!data || data.supplements.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="animate-scale-in mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="animate-fade-in-up mb-2 text-2xl font-bold">영양소 대시보드</h1>
        <p className="animate-fade-in-up stagger-1 text-muted-foreground">
          내 영양제를 등록하면 1일 총 섭취량을 확인할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">영양소 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          등록된 영양제 {data.supplements.length}개 기준 1일 총 섭취량
        </p>
      </div>

      {/* Today's intake checklist */}
      <div className="animate-fade-in-up stagger-1 mb-8">
        <IntakeChecklist />
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="animate-fade-in-up stagger-2 mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">주의 사항</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.warnings.map((warning) => (
              <WarningCard key={warning.ingredient} warning={warning} />
            ))}
          </div>
        </div>
      )}

      {/* Nutrient Interactions */}
      {data.interactions && data.interactions.length > 0 && (
        <div className="animate-fade-in-up stagger-3 mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">성분 상호작용</h2>
          <div className="space-y-3">
            {data.interactions.map((interaction) => (
              <InteractionCard
                key={interaction.nutrients.join('-')}
                interaction={interaction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Supplement list */}
      <div className="animate-fade-in-up stagger-4 mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">복용 중인 영양제</h2>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="divide-y divide-border/60">
            {data.supplements.map((s) => (
              <div
                key={s.product_name}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-medium">{s.product_name}</span>
                <span className="text-sm text-muted-foreground">
                  1일 {s.daily_dose}회
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nutrient Chart */}
      <div className="animate-fade-in-up stagger-5 mb-8">
        <NutrientChart nutrients={data.total_nutrients} />
      </div>

      {/* Intake Calendar */}
      <div className="animate-fade-in-up stagger-6">
        <IntakeCalendar />
      </div>
    </div>
  )
}
