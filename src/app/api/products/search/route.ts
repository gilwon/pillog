import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ProductSearchResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
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

    const supabase = await createClient()

    // Use pg_trgm search function
    const { data, error } = await supabase.rpc('search_products', {
      query: query.trim(),
      lim: limit,
      off_set: offset,
    })

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

    // Get total count
    const { data: countData } = await supabase.rpc('count_search_products', {
      query: query.trim(),
    })
    const total = Number(countData) || 0

    // Apply optional category filter (functionality_tags @> ARRAY[category])
    let results = (data || []) as Record<string, unknown>[]
    if (category && category.trim().length > 0) {
      results = results.filter((item) => {
        const tags = (item.functionality_tags as string[]) || []
        return tags.includes(category.trim())
      })
    }

    const response: ProductSearchResponse = {
      data: results.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        name: item.name as string,
        company: item.company as string,
        functionality_tags: (item.functionality_tags as string[]) || [],
        shape: item.shape as string | null,
        similarity_score: Number(item.similarity_score) || 0,
      })),
      pagination: {
        page,
        limit,
        total: category ? results.length : total,
        total_pages: Math.ceil((category ? results.length : total) / limit),
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
