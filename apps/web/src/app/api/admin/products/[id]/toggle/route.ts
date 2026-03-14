import { requireAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = await params

    // 현재 상태 조회
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: { code: 'PRODUCT_NOT_FOUND', message: '제품을 찾을 수 없습니다.', status: 404 } },
        { status: 404 }
      )
    }

    // 토글 (활성화 시 removed_from_api도 초기화)
    const updates = product.is_active
      ? { is_active: false }
      : { is_active: true, removed_from_api: false }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
