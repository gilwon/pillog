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
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">영양소 대시보드</h1>
        <p className="text-muted-foreground">
          내 영양제를 등록하면 1일 총 섭취량을 확인할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">영양소 대시보드</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        등록된 영양제 {data.supplements.length}개 기준 1일 총 섭취량
      </p>

      {/* Today's intake checklist */}
      <div className="mb-6">
        <IntakeChecklist />
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.warnings.map((warning) => (
            <WarningCard key={warning.ingredient} warning={warning} />
          ))}
        </div>
      )}

      {/* Nutrient Interactions */}
      {data.interactions && data.interactions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-semibold">성분 상호작용</h2>
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
      <div className="mb-6 rounded-lg border border-border p-4">
        <h2 className="mb-3 font-semibold">복용 중인 영양제</h2>
        <div className="space-y-2">
          {data.supplements.map((s) => (
            <div
              key={s.product_name}
              className="flex items-center justify-between text-sm"
            >
              <span>{s.product_name}</span>
              <span className="text-muted-foreground">
                1일 {s.daily_dose}회
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrient Chart */}
      <div className="mb-6">
        <NutrientChart nutrients={data.total_nutrients} />
      </div>

      {/* Intake Calendar */}
      <IntakeCalendar />
    </div>
  )
}
