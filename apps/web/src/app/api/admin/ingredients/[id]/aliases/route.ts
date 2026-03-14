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

    const { data, error } = await supabase
      .from('ingredient_aliases')
      .select('*')
      .eq('ingredient_id', id)
      .order('alias_name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const { alias_name, alias_type } = body

    if (!alias_name) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '별칭명은 필수입니다.', status: 400 } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ingredient_aliases')
      .insert({
        ingredient_id: id,
        alias_name,
        alias_type: alias_type || 'common',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '이미 존재하는 별칭입니다.', status: 409 } },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAdmin()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const aliasId = searchParams.get('aliasId')

    if (!aliasId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'aliasId가 필요합니다.', status: 400 } },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ingredient_aliases')
      .delete()
      .eq('id', aliasId)
      .eq('ingredient_id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
