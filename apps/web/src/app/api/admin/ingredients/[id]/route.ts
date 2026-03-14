import { requireAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      'canonical_name', 'category', 'subcategory', 'description',
      'primary_effect', 'daily_rdi', 'daily_ul', 'rdi_unit', 'source_info',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '수정할 필드가 없습니다.', status: 400 } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: { code: 'INGREDIENT_NOT_FOUND', message: '성분을 찾을 수 없습니다.', status: 404 } },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
