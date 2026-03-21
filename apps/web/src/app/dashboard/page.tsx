'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NutrientChart } from '@/features/dashboard/components/NutrientChart'
import { WarningCard } from '@/features/dashboard/components/WarningCard'
import { InteractionCard } from '@/features/dashboard/components/InteractionCard'
import { IntakeChecklist } from '@/features/dashboard/components/IntakeChecklist'
import { IntakeCalendar } from '@/features/dashboard/components/IntakeCalendar'
import { Loader2, BarChart3, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DashboardResponse } from '@/types/api'

async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch('/api/my/dashboard')
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  return res.json()
}

type SectionId = 'checklist' | 'warnings' | 'interactions' | 'supplements' | 'chart' | 'calendar'

const DEFAULT_ORDER: SectionId[] = ['checklist', 'warnings', 'interactions', 'supplements', 'chart', 'calendar']

function getInitialOrder(): SectionId[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER
  try {
    const saved = localStorage.getItem('pillog-dashboard-order')
    if (saved) {
      const parsed = JSON.parse(saved) as SectionId[]
      // 유효성 검사: 모든 섹션이 포함되어 있는지
      if (parsed.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every((s) => parsed.includes(s))) {
        return parsed
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  })

  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(getInitialOrder)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverItem.current = index
  }, [])

  const handleDrop = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) return

    setSectionOrder((prev) => {
      const next = [...prev]
      const [removed] = next.splice(dragItem.current!, 1)
      next.splice(dragOverItem.current!, 0, removed)
      localStorage.setItem('pillog-dashboard-order', JSON.stringify(next))
      return next
    })

    dragItem.current = null
    dragOverItem.current = null
  }, [])

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

  const sections: Record<SectionId, React.ReactNode> = {
    checklist: <IntakeChecklist />,
    warnings: data.warnings.length > 0 ? (
      <>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">주의 사항</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.warnings.map((warning) => (
            <WarningCard key={warning.ingredient} warning={warning} />
          ))}
        </div>
      </>
    ) : null,
    interactions: data.interactions && data.interactions.length > 0 ? (
      <>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">성분 상호작용</h2>
        <div className="space-y-3">
          {data.interactions.map((interaction) => (
            <InteractionCard
              key={interaction.nutrients.join('-')}
              interaction={interaction}
            />
          ))}
        </div>
      </>
    ) : null,
    supplements: (
      <>
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
      </>
    ),
    chart: <NutrientChart nutrients={data.total_nutrients} />,
    calendar: <IntakeCalendar />,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">영양소 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          등록된 영양제 {data.supplements.length}개 기준 1일 총 섭취량
        </p>
      </div>

      {sectionOrder.map((sectionId, index) => {
        const content = sections[sectionId]
        if (!content) return null

        return (
          <div
            key={sectionId}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            className={cn(
              'group mb-8',
              dragItem.current === index && 'opacity-50',
            )}
          >
            <div className="relative">
              <div className="absolute -left-7 top-1 hidden cursor-grab text-muted-foreground/30 transition-colors hover:text-muted-foreground group-hover:block active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
              </div>
              {content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
