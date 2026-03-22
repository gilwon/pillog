import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin()
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '삭제할 이력 ID가 필요합니다.', status: 400 } },
        { status: 400 }
      )
    }

    // sync_log_products는 CASCADE로 자동 삭제됨
    const { error } = await supabase
      .from('sync_logs')
      .delete()
      .in('id', ids)

    if (error) throw error

    return NextResponse.json({ deleted: ids.length })
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
