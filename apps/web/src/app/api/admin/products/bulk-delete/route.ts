import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin()
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '삭제할 제품 ID가 필요합니다.', status: 400 } },
        { status: 400 }
      )
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '한 번에 최대 100개까지 삭제할 수 있습니다.', status: 400 } },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('products')
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
