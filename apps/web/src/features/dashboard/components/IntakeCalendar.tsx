'use client'

import { useState, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useIntakeHistory } from '@/features/dashboard/hooks/useIntakeHistory'
import { cn } from '@/lib/utils/cn'

interface DaySupplement {
  supplement_id: string
  product_name: string
  is_taken: boolean
}

interface DayDetailResponse {
  date: string
  supplements: DaySupplement[]
  taken_count: number
  total_count: number
}

async function fetchDayDetail(date: string): Promise<DayDetailResponse> {
  const res = await fetch(`/api/my/intake?date=${date}`)
  if (!res.ok) throw new Error('Failed to fetch day detail')
  return res.json()
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function getCalendarDays(year: number, month: number) {
  const date = new Date(year, month - 1, 1)
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

export function IntakeCalendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const { data, isLoading } = useIntakeHistory(year, month)

  const { data: dayDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['intake-day', selectedDate],
    queryFn: () => fetchDayDetail(selectedDate!),
    enabled: !!selectedDate,
  })

  const pctMap = useMemo(() => {
    const map = new Map<string, number>()
    if (data?.days) {
      for (const day of data.days) {
        map.set(day.date, day.pct)
      }
    }
    return map
  }, [data])

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month]
  )

  const goToPrevMonth = () => setCurrentDate((d) => subMonths(d, 1))
  const goToNextMonth = () => setCurrentDate((d) => addMonths(d, 1))

  return (
    <div className="rounded-lg border border-border p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-semibold">
          {format(currentDate, 'yyyy년 M월', { locale: ko })}
        </h2>
        <button
          onClick={goToNextMonth}
          className="rounded-md p-1 hover:bg-muted"
          aria-label="다음 달"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  'py-1',
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const inMonth = isSameMonth(day, currentDate)
              const today = isToday(day)
              const pct = pctMap.get(dateStr)
              const dow = day.getDay() // 0=일, 6=토

              const isSelected = selectedDate === dateStr

              return (
                <div
                  key={dateStr}
                  onClick={() => inMonth && setSelectedDate((prev) => prev === dateStr ? null : dateStr)}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-md text-sm transition-colors',
                    inMonth && 'cursor-pointer hover:bg-muted/60',
                    today && 'ring-2 ring-primary ring-offset-1',
                    isSelected && 'bg-primary/10',
                    !isSelected && inMonth && pct === 100 && 'bg-green-100 font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300',
                    !isSelected && inMonth && pct !== undefined && pct > 0 && pct < 100 && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                    !today && inMonth && (pct === undefined || pct === 0) && dow === 0 && 'text-red-500',
                    !today && inMonth && (pct === undefined || pct === 0) && dow === 6 && 'text-blue-500',
                    !today && inMonth && (pct === undefined || pct === 0) && dow !== 0 && dow !== 6 && 'text-muted-foreground',
                    !inMonth && dow === 0 && 'text-red-300/50',
                    !inMonth && dow === 6 && 'text-blue-300/50',
                    !inMonth && dow !== 0 && dow !== 6 && 'text-muted-foreground/30',
                  )}
                >
                  {format(day, 'd')}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-800" />
              <span>전체 복용</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-yellow-200 dark:bg-yellow-800" />
              <span>일부 복용</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-muted" />
              <span>기록 없음</span>
            </div>
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
        </>
      )}
    </div>
  )
}
