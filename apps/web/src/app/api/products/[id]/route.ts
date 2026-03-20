import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DISCLAIMER = '이 정보는 식약처 공공데이터를 기반으로 하며, 의학적 조언이 아닙니다.'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !product) {
      return NextResponse.json(
        {
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: '요청한 제품을 찾을 수 없습니다.',
            status: 404,
          },
        },
        { status: 404 }
      )
    }

    // nutrient_rdi fallback + ingredients 병렬 조회
    const [ingredientsResult, rdiResult] = await Promise.all([
      supabase
        .from('product_ingredients')
        .select(
          `
          id,
          amount,
          amount_unit,
          percentage_of_rdi,
          is_functional,
          ingredient:ingredients(
            id,
            canonical_name,
            category,
            description,
            primary_effect,
            daily_rdi,
            daily_ul,
            rdi_unit
          )
        `
        )
        .eq('product_id', id)
        .order('is_functional', { ascending: false }),
      supabase
        .from('nutrient_rdi')
        .select('name, category, daily_rdi, daily_ul, rdi_unit, description')
        .limit(500),
    ])

    const rdiMap = new Map<string, { category: string; daily_rdi: number | null; daily_ul: number | null; rdi_unit: string | null; description: string | null }>()
    for (const r of rdiResult.data || []) rdiMap.set(r.name, r)

    const formattedIngredients = (ingredientsResult.data || []).map(
      (pi: Record<string, unknown>) => {
        const ing = pi.ingredient as unknown as Record<string, unknown> | null
        const name = (ing?.canonical_name as string) ?? ''
        const rdiRef = rdiMap.get(name)
        return {
          id: ing?.id ?? '',
          canonical_name: name,
          description: ing?.description ?? rdiRef?.description ?? null,
          primary_effect: ing?.primary_effect ?? rdiRef?.description ?? null,
          amount: pi.amount,
          amount_unit: pi.amount_unit,
          percentage_of_rdi: pi.percentage_of_rdi,
          daily_rdi: (ing?.daily_rdi as number) ?? rdiRef?.daily_rdi ?? null,
          daily_ul: (ing?.daily_ul as number) ?? rdiRef?.daily_ul ?? null,
          rdi_unit: (ing?.rdi_unit as string) ?? rdiRef?.rdi_unit ?? null,
          is_functional: pi.is_functional,
          category: (ing?.category as string) ?? rdiRef?.category ?? '기타',
        }
      }
    )

    return NextResponse.json({
      ...product,
      ingredients: formattedIngredients,
      disclaimer: DISCLAIMER,
    })
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
