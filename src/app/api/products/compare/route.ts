import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ProductCompareResponse, ComparisonItem } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '비교할 제품 ID를 입력해주세요.',
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    const ids = idsParam.split(',').filter(Boolean)

    if (ids.length < 2 || ids.length > 4) {
      return NextResponse.json(
        {
          error: {
            code: 'COMPARE_LIMIT',
            message: '비교는 2~4개 제품만 가능합니다.',
            status: 400,
          },
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, company')
      .in('id', ids)

    if (productsError || !products || products.length < 2) {
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

    // Fetch all ingredients for these products
    const { data: allIngredients } = await supabase
      .from('product_ingredients')
      .select(
        `
        product_id,
        amount,
        percentage_of_rdi,
        ingredient:ingredients(
          canonical_name,
          category,
          daily_rdi,
          daily_ul,
          rdi_unit
        )
      `
      )
      .in('product_id', ids)

    // Build comparison table
    const ingredientMap = new Map<string, ComparisonItem>()

    for (const pi of allIngredients || []) {
      const ing = pi.ingredient as unknown as Record<string, unknown> | null
      if (!ing) continue

      const name = ing.canonical_name as string
      if (!ingredientMap.has(name)) {
        ingredientMap.set(name, {
          ingredient: name,
          category: (ing.category as string) || '기타',
          rdi: (ing.daily_rdi as number) ?? null,
          ul: (ing.daily_ul as number) ?? null,
          unit: (ing.rdi_unit as string) ?? null,
          products: {},
        })
      }

      const item = ingredientMap.get(name)!
      item.products[pi.product_id as string] = {
        amount: (pi.amount as number) ?? null,
        rdi_pct: (pi.percentage_of_rdi as number) ?? null,
      }
    }

    const response: ProductCompareResponse = {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company,
      })),
      comparison_table: Array.from(ingredientMap.values()).sort((a, b) =>
        a.category.localeCompare(b.category)
      ),
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
