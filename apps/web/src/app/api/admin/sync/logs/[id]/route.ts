import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase } = await requireAdmin()

    const changeType = request.nextUrl.searchParams.get('type') // new | updated | deactivated
    const page = parseInt(request.nextUrl.searchParams.get('page') ?? '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50')
    const offset = (page - 1) * limit

    const { data: log, error: logError } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('id', id)
      .single()

    if (logError || !log) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '동기화 이력을 찾을 수 없습니다.', status: 404 } },
        { status: 404 }
      )
    }

    let query = supabase
      .from('sync_log_products')
      .select(
        `id, sync_log_id, product_id, change_type,
         product:products(id, name, company, report_no)`,
        { count: 'exact' }
      )
      .eq('sync_log_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (changeType) {
      query = query.eq('change_type', changeType)
    }

    const { data: products, count, error: prodError } = await query
    if (prodError) throw prodError

    return NextResponse.json({
      log,
      products: products ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (err) {
    if (err instanceof Response) throw err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
