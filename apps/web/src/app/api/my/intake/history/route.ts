import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * GET /api/my/intake/history?year=2026&month=3
 * 월간 날짜별 복용률 조회.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const year = Number(searchParams.get('year')) || now.getFullYear()
    const month = Number(searchParams.get('month')) || now.getMonth() + 1

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효한 연/월 값이 필요합니다.', status: 400 } },
        { status: 400 }
      )
    }

    // 월의 시작/끝 날짜
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`

    // 1. 현재 등록 영양제 수
    const { count: currentTotal } = await supabase
      .from('user_supplements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 2. 해당 월의 전체 복용 기록 (is_taken 무관 — 날짜별 총 기록 수로 total 계산)
    const { data: allLogs, error: logError } = await supabase
      .from('intake_logs')
      .select('taken_date, is_taken')
      .eq('user_id', user.id)
      .gte('taken_date', startDate)
      .lt('taken_date', endDate)
      .limit(1000)

    if (logError) throw logError

    if (!allLogs || allLogs.length === 0) {
      return NextResponse.json({ year, month, days: [] })
    }

    // 3. 날짜별 집계: total = 그 날 기록된 총 제품 수, taken = is_taken=true 수
    const dateStats = new Map<string, { taken: number; total: number }>()
    for (const log of allLogs) {
      const d = log.taken_date
      if (!dateStats.has(d)) dateStats.set(d, { taken: 0, total: 0 })
      const stat = dateStats.get(d)!
      stat.total++
      if (log.is_taken) stat.taken++
    }

    // 4. 결과 변환 — total은 해당 날짜의 기록 수 또는 현재 등록 수 중 큰 값
    const days = Array.from(dateStats.entries())
      .map(([date, stat]) => {
        const total = Math.max(stat.total, currentTotal || 0)
        return {
          date,
          taken: stat.taken,
          total,
          pct: total > 0 ? Math.round((stat.taken / total) * 100) : 0,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ year, month, days })
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
