import { requireAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { AdminProductsResponse } from '@/types/api'
import { escapeLike } from '@/lib/utils/escape-like'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin()
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q')?.trim() || ''
    const status = searchParams.get('status') // 'active' | 'inactive' | null (all)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit

    const VALID_SORT_COLUMNS = ['name', 'company', 'report_no', 'is_active', 'reported_at', 'created_at'] as const
    type SortColumn = typeof VALID_SORT_COLUMNS[number]
    const sortByRaw = searchParams.get('sortBy') || 'created_at'
    const sortBy: SortColumn = VALID_SORT_COLUMNS.includes(sortByRaw as SortColumn)
      ? (sortByRaw as SortColumn)
      : 'created_at'
    const ascending = searchParams.get('sortOrder') === 'asc'

    let queryBuilder = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // 상태 필터
    if (status === 'active') {
      queryBuilder = queryBuilder.eq('is_active', true)
    } else if (status === 'inactive') {
      queryBuilder = queryBuilder.eq('is_active', false)
    } else if (status === 'removed') {
      queryBuilder = queryBuilder.eq('removed_from_api', true)
    }

    // 검색어 필터
    if (query) {
      const escaped = escapeLike(query)
      queryBuilder = queryBuilder.or(`name.ilike.%${escaped}%,company.ilike.%${escaped}%,report_no.ilike.%${escaped}%`)
    }

    const { data, error, count } = await queryBuilder
      .order(sortBy, { ascending })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const total = count ?? 0
    const response: AdminProductsResponse = {
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

    const {
      report_no,
      name,
      company,
      primary_functionality,
      functionality_tags,
      how_to_take,
      caution,
      shape,
      standard,
      shelf_life,
      storage_method,
      raw_materials,
      image_url,
    } = body

    if (!name || !report_no) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '제품명과 신고번호는 필수입니다.', status: 400 } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        report_no,
        name,
        company: company || '',
        primary_functionality: primary_functionality || '',
        functionality_tags: functionality_tags || [],
        how_to_take: how_to_take || null,
        caution: caution || null,
        shape: shape || null,
        standard: standard || null,
        shelf_life: shelf_life || null,
        storage_method: storage_method || null,
        raw_materials: raw_materials || null,
        image_url: image_url || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '이미 존재하는 신고번호입니다.', status: 409 } },
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
