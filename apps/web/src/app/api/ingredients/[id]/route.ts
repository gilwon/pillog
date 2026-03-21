import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: ingredient, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !ingredient) {
      return NextResponse.json(
        {
          error: {
            code: 'INGREDIENT_NOT_FOUND',
            message: '요청한 성분을 찾을 수 없습니다.',
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // Fetch aliases + nutrient_rdi fallback 병렬
    const [aliasResult, rdiResult] = await Promise.all([
      supabase.from('ingredient_aliases').select('alias_name, alias_type').eq('ingredient_id', id),
      ingredient.daily_rdi == null
        ? supabase.from('nutrient_rdi').select('daily_rdi, daily_ul, rdi_unit, category, description').eq('name', ingredient.canonical_name).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    // nutrient_rdi fallback 적용
    const rdiRef = rdiResult.data
    const merged = {
      ...ingredient,
      daily_rdi: ingredient.daily_rdi ?? rdiRef?.daily_rdi ?? null,
      daily_ul: ingredient.daily_ul ?? rdiRef?.daily_ul ?? null,
      rdi_unit: ingredient.rdi_unit ?? rdiRef?.rdi_unit ?? null,
      category: ingredient.category || rdiRef?.category || '기타',
      primary_effect: ingredient.primary_effect ?? rdiRef?.description ?? null,
      aliases: aliasResult.data || [],
    }

    return NextResponse.json(merged)
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
