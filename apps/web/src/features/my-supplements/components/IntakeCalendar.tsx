'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DayRecord {
  date: string
  taken: number
  total: number
  pct: number
}

interface IntakeHistoryResponse {
  year: number
  month: number
  days: DayRecord[]
}

interface DaySupplement {
  supplement_id: string
  product_id: string
  product_name: string
  is_taken: boolean
  ingredients: Array<{ name: string; amount: number | null; unit: string | null }>
}

interface DayDetailResponse {
  date: string
  supplements: DaySupplement[]
  taken_count: number
  total_count: number
}

async function fetchHistory(
  year: number,
  month: number
): Promise<IntakeHistoryResponse> {
  const res = await fetch(`/api/my/intake/history?year=${year}&month=${month}`)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

async function fetchDayDetail(date: string): Promise<DayDetailResponse> {
  const res = await fetch(`/api/my/intake?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch day detail')
  return res.json()
}

function getPctColor(pct: number): string {
  if (pct >= 80) return 'bg-safe text-white'
  if (pct >= 50) return 'bg-caution text-white'
  return 'bg-warning/80 text-white'
}

export function IntakeCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['intake-history', year, month],
    queryFn: () => fetchHistory(year, month),
  })

  const { data: dayDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['intake-day', selectedDate],
    queryFn: () => fetchDayDetail(selectedDate!),
    enabled: !!selectedDate,
  })

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const goNext = () => {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    if (
      nextYear > now.getFullYear() ||
      (nextYear === now.getFullYear() && nextMonth > now.getMonth() + 1)
    )
      return
    setYear(nextYear)
    setMonth(nextMonth)
  }

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const dayMap = new Map<string, DayRecord>(
    (data?.days ?? []).map((d) => [d.date, d])
  )

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const handleDayClick = (dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr))
  }

  return (
    <div className="rounded-lg border border-border p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={goPrev}
          className="rounded p-1 hover:bg-muted"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">
          {year}년 {month}월
        </span>
        <button
          onClick={goNext}
          disabled={isCurrentMonth}
          className="rounded p-1 hover:bg-muted disabled:opacity-30"
          aria-label="다음 달"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div
            key={d}
            className={
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
            }
          >
            {d}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const record = dayMap.get(dateStr)
            const isToday = dateStr === today
            const isSelected = selectedDate === dateStr
            const col = (firstDay + i) % 7

            return (
              <div
                key={day}
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-0.5 rounded-md py-1 transition-colors hover:bg-muted/60',
                  isToday && 'ring-1 ring-primary ring-offset-1',
                  isSelected && 'bg-primary/10'
                )}
              >
                <span
                  className={cn(
                    'text-xs',
                    isToday
                      ? 'font-bold text-primary'
                      : col === 0
                        ? 'text-red-500'
                        : col === 6
                          ? 'text-blue-500'
                          : 'text-foreground'
                  )}
                >
                  {day}
                </span>
                {record ? (
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium',
                      getPctColor(record.pct)
                    )}
                    title={`${record.taken}/${record.total} 복용 (${record.pct}%)`}
                  >
                    {record.pct}
                  </span>
                ) : (
                  <span className="h-5 w-5" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-safe" /> 80%↑
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-caution" /> 50~79%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-warning/80" /> ~49%
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">날짜 클릭 시 상세</span>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedDate.replace(/-/g, '.')} 복용 기록
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {detailLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : !dayDetail?.supplements?.length ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              등록된 영양제가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {dayDetail.supplements.map((s) => (
                <div
                  key={s.supplement_id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                >
                  <span className={cn(!s.is_taken && 'text-muted-foreground')}>
                    {s.product_name}
                  </span>
                  {s.is_taken ? (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      ✅ 복용
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">⬜ 미복용</span>
                  )}
                </div>
              ))}
              <p className="pt-1 text-right text-xs text-muted-foreground">
                {dayDetail.taken_count} / {dayDetail.total_count} 복용
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
