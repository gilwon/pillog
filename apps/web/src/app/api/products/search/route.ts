import { createClient } from '@/lib/supabase/server'
import { searchWithMeilisearch } from '@/lib/meilisearch/search'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ProductSearchResponse } from '@/types/api'
import { escapeLike } from '@/lib/utils/escape-like'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const match = searchParams.get('match') === 'any' ? 'any' : 'all'
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))
    const offset = (page - 1) * limit

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '검색어를 입력해주세요.',
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    const q = query.trim()
    let data: ProductSearchResponse['data'] = []
    let total = 0

    // 1차: Meilisearch (한글 형태소 분석 + 동의어 + 오타 허용)
    try {
      const result = await searchWithMeilisearch({
        query: q,
        limit,
        offset,
        category: category ?? undefined,
      })
      data = result.data
      total = result.total
    } catch {
      // 2차: pg_trgm fallback
      console.warn('[Search] Meilisearch unavailable, using pg_trgm fallback')

      const supabase = await createClient()

      const [{ data: rpcData, error }, { data: countData }] = await Promise.all([
        supabase.rpc('search_products', { query: q, lim: limit, off_set: offset, match_mode: match }),
        supabase.rpc('count_search_products', { query: q, match_mode: match }),
      ])

      if (error) {
        console.error('Search error:', error)
        return NextResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: '검색 중 오류가 발생했습니다.',
              status: 500,
            },
          },
          { status: 500 }
        )
      }

      let results = (rpcData || []) as Record<string, unknown>[]
      total = Number(countData) || 0

      if (category && category.trim().length > 0) {
        results = results.filter((item) => {
          const tags = (item.functionality_tags as string[]) || []
          return tags.includes(category.trim())
        })
      }

      // Fallback: pg_trgm 결과 없으면 functionality_tags 부분 일치 검색
      if (results.length === 0) {
        const [{ data: tagData }, { count: tagCount }] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, company, functionality_tags, shape')
            .eq('is_active', true)
            .filter('functionality_tags::text', 'ilike', `%${escapeLike(q)}%`)
            .range(offset, offset + limit - 1),
          supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .filter('functionality_tags::text', 'ilike', `%${escapeLike(q)}%`),
        ])

        if (tagData && tagData.length > 0) {
          results = tagData as Record<string, unknown>[]
          total = tagCount ?? tagData.length
        }
      }

      data = results.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        name: item.name as string,
        company: item.company as string,
        functionality_tags: (item.functionality_tags as string[]) || [],
        shape: item.shape as string | null,
        similarity_score: Number(item.similarity_score) || 0,
      }))
    }

    const response: ProductSearchResponse = {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
