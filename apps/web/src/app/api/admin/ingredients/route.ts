import { requireAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { AdminIngredientsResponse } from '@/types/api'
import { escapeLike } from '@/lib/utils/escape-like'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin()
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q')?.trim() || ''
    const category = searchParams.get('category')?.trim() || ''
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit

    let queryBuilder = supabase
      .from('ingredients')
      .select('*', { count: 'exact' })

    if (query) {
      queryBuilder = queryBuilder.ilike('canonical_name', `%${escapeLike(query)}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    const { data, error, count } = await queryBuilder
      .order('canonical_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const total = count ?? 0
    const response: AdminIngredientsResponse = {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    if (err instanceof NextResponse) return err
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin()
    const body = await request.json()

    const { canonical_name, category, subcategory, description, primary_effect, daily_rdi, daily_ul, rdi_unit, source_info } = body

    if (!canonical_name) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '성분명은 필수입니다.', status: 400 } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ingredients')
      .insert({
        canonical_name,
        category: category || '기타',
        subcategory: subcategory || null,
        description: description || null,
        primary_effect: primary_effect || null,
        daily_rdi: daily_rdi != null ? Number(daily_rdi) : null,
        daily_ul: daily_ul != null ? Number(daily_ul) : null,
        rdi_unit: rdi_unit || null,
        source_info: source_info || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '이미 존재하는 성분명입니다.', status: 409 } },
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
