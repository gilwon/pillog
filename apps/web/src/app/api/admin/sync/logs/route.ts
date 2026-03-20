import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin()

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '20')))
    const offset = (page - 1) * limit

    const { data, count, error } = await supabase
      .from('sync_logs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
