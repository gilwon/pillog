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

    // 1. 총 등록 영양제 수
    const { count: totalSupplements, error: countError } = await supabase
      .from('user_supplements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) throw countError

    const total = totalSupplements || 0

    if (total === 0) {
      return NextResponse.json({
        year,
        month,
        days: [],
      })
    }

    // 2. 해당 월의 복용 기록 (is_taken=true만, 최대 1000건 — 월 31일 × 최대 30개 영양제 = 최대 930건)
    const { data: logs, error: logError } = await supabase
      .from('intake_logs')
      .select('taken_date')
      .eq('user_id', user.id)
      .eq('is_taken', true)
      .gte('taken_date', startDate)
      .lt('taken_date', endDate)
      .limit(1000)

    if (logError) throw logError

    // 3. 날짜별 복용 개수 집계
    const dateCount = new Map<string, number>()
    for (const log of logs || []) {
      const d = log.taken_date
      dateCount.set(d, (dateCount.get(d) || 0) + 1)
    }

    // 4. 결과 변환
    const days = Array.from(dateCount.entries())
      .map(([date, taken]) => ({
        date,
        taken,
        total,
        pct: Math.round((taken / total) * 100),
      }))
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
