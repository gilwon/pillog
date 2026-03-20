import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * GET /api/my/intake?date=YYYY-MM-DD
 * 특정 날짜의 복용 현황 조회.
 * user_supplements LEFT JOIN intake_logs로 체크 여부 반환.
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
    const dateParam = searchParams.get('date')
    // KST 기준 오늘 날짜 (서버 UTC와 한국 시간 불일치 방지)
    const date = dateParam || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '날짜 형식은 YYYY-MM-DD여야 합니다.', status: 400 } },
        { status: 400 }
      )
    }

    // 1. 사용자의 등록 영양제 목록 (주요 성분 포함)
    const { data: supplements, error: suppError } = await supabase
      .from('user_supplements')
      .select(`
        id,
        product_id,
        daily_dose,
        product:products(
          name,
          product_ingredients(
            amount,
            amount_unit,
            ingredient:ingredients(canonical_name, category)
          )
        )
      `)
      .eq('user_id', user.id)

    if (suppError) throw suppError

    if (!supplements || supplements.length === 0) {
      return NextResponse.json({
        date,
        supplements: [],
        taken_count: 0,
        total_count: 0,
      })
    }

    // 2. 해당 날짜의 복용 기록
    const productIds = supplements.map((s) => s.product_id)
    const { data: logs, error: logError } = await supabase
      .from('intake_logs')
      .select('product_id, is_taken')
      .eq('user_id', user.id)
      .eq('taken_date', date)
      .in('product_id', productIds)

    if (logError) throw logError

    const logMap = new Map(
      (logs || []).map((l) => [l.product_id, l.is_taken])
    )

    // 3. 결과 조합
    const items = supplements.map((s) => {
      const product = s.product as unknown as {
        name: string
        product_ingredients: Array<{
          amount: number | null
          amount_unit: string | null
          ingredient: { canonical_name: string; category: string } | null
        }>
      } | null

      // 주요 성분 최대 4개 (양 있는 것 우선)
      const rawIngredients = (product?.product_ingredients ?? [])
        .filter((pi) => pi.ingredient)
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
        .slice(0, 4)
        .map((pi) => ({
          name: pi.ingredient!.canonical_name,
          amount: pi.amount ?? null,
          unit: pi.amount_unit ?? null,
        }))

      return {
        supplement_id: s.id,
        product_id: s.product_id,
        product_name: product?.name || '',
        is_taken: logMap.get(s.product_id) ?? false,
        ingredients: rawIngredients,
      }
    })

    const takenCount = items.filter((i) => i.is_taken).length

    return NextResponse.json({
      date,
      supplements: items,
      taken_count: takenCount,
      total_count: items.length,
    })
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

/**
 * POST /api/my/intake
 * 복용 기록 UPSERT.
 * { product_id, taken_date, is_taken }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { product_id, taken_date, is_taken } = body

    if (!product_id || !isValidUUID(product_id)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효한 제품 ID가 필요합니다.',
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    const date = taken_date || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '날짜 형식은 YYYY-MM-DD여야 합니다.', status: 400 } },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('intake_logs')
      .upsert(
        {
          user_id: user.id,
          product_id,
          taken_date: date,
          is_taken: is_taken ?? true,
        },
        { onConflict: 'user_id,product_id,taken_date' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
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
