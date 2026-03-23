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

    // 데이터 쿼리 (카운트 없이, 정렬+페이징만 — 빠름)
    let dataQuery = supabase
      .from('products')
      .select('id, report_no, name, company, is_active, removed_from_api, reported_at, synced_at, created_at')

    // 카운트 쿼리 (head: true로 데이터 없이 카운트만)
    let countQuery = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // 필터 적용 (양쪽 동일)
    if (status === 'active') {
      dataQuery = dataQuery.eq('is_active', true)
      countQuery = countQuery.eq('is_active', true)
    } else if (status === 'inactive') {
      dataQuery = dataQuery.eq('is_active', false)
      countQuery = countQuery.eq('is_active', false)
    } else if (status === 'removed') {
      dataQuery = dataQuery.eq('removed_from_api', true)
      countQuery = countQuery.eq('removed_from_api', true)
    }
    if (query) {
      const escaped = escapeLike(query)
      const orFilter = `name.ilike.%${escaped}%,company.ilike.%${escaped}%,report_no.ilike.%${escaped}%`
      dataQuery = dataQuery.or(orFilter)
      countQuery = countQuery.or(orFilter)
    }

    // 정렬 (데이터 쿼리에만)
    const hasCustomSort = searchParams.has('sortBy')
    if (!hasCustomSort) {
      dataQuery = dataQuery.order('created_at', { ascending: false })
    } else {
      dataQuery = dataQuery.order(sortBy, { ascending })
    }

    // 병렬 실행
    const [dataResult, countResult] = await Promise.all([
      dataQuery.range(offset, offset + limit - 1),
      countQuery,
    ])

    if (dataResult.error) throw dataResult.error

    const total = countResult.count ?? 0
    const response: AdminProductsResponse = {
      data: dataResult.data || [],
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
