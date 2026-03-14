import { requireAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = await params

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !product) {
      return NextResponse.json(
        { error: { code: 'PRODUCT_NOT_FOUND', message: '제품을 찾을 수 없습니다.', status: 404 } },
        { status: 404 }
      )
    }

    // 성분 정보 포함
    const { data: ingredients } = await supabase
      .from('product_ingredients')
      .select(`
        id,
        ingredient_id,
        amount,
        amount_unit,
        percentage_of_rdi,
        is_functional,
        ingredient:ingredients(canonical_name)
      `)
      .eq('product_id', id)

    return NextResponse.json({
      ...product,
      ingredients: (ingredients || []).map((pi) => ({
        id: pi.id,
        ingredient_id: pi.ingredient_id,
        canonical_name: (pi.ingredient as unknown as { canonical_name: string })?.canonical_name || '',
        amount: pi.amount,
        amount_unit: pi.amount_unit,
        percentage_of_rdi: pi.percentage_of_rdi,
        is_functional: pi.is_functional,
      })),
    })
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = await params

    // removed_from_api 제품만 영구 삭제 허용 (실수 방지)
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('removed_from_api')
      .eq('id', id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: { code: 'PRODUCT_NOT_FOUND', message: '제품을 찾을 수 없습니다.', status: 404 } },
        { status: 404 }
      )
    }

    if (!product.removed_from_api) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'API 제거된 제품만 영구 삭제할 수 있습니다.', status: 403 } },
        { status: 403 }
      )
    }

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      'name', 'company', 'report_no', 'primary_functionality',
      'functionality_tags', 'how_to_take', 'caution', 'shape',
      'standard', 'shelf_life', 'storage_method', 'raw_materials',
      'image_url', 'is_active',
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
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: { code: 'PRODUCT_NOT_FOUND', message: '제품을 찾을 수 없습니다.', status: 404 } },
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
