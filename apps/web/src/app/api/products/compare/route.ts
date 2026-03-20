import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ProductCompareResponse, ComparisonItem } from '@/types/api'
import { parseRawMaterials } from '@pillog/shared/parse-ingredients'

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

    if (!ids.every((id) => isValidUUID(id))) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 제품 ID가 포함되어 있습니다.', status: 400 } },
        { status: 400 }
      )
    }

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

    // Fetch products (with raw_materials for direct parsing)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, company, raw_materials')
      .in('id', ids)
      .eq('is_active', true)

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

    // nutrient_rdi fallback 로드
    const { data: rdiRows } = await supabase
      .from('nutrient_rdi')
      .select('name, category, daily_rdi, daily_ul, rdi_unit')
      .limit(500)
    const rdiMap = new Map<string, { category: string; daily_rdi: number | null; daily_ul: number | null; rdi_unit: string | null }>()
    for (const r of rdiRows || []) rdiMap.set(r.name, r)

    // Fetch linked ingredients from product_ingredients
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

    // Build comparison table from linked ingredients
    const ingredientMap = new Map<string, ComparisonItem>()

    for (const pi of allIngredients || []) {
      const ing = pi.ingredient as unknown as Record<string, unknown> | null
      if (!ing) continue

      const name = ing.canonical_name as string
      const rdiRef = rdiMap.get(name)

      if (!ingredientMap.has(name)) {
        ingredientMap.set(name, {
          ingredient: name,
          category: (ing.category as string) || rdiRef?.category || '기타',
          rdi: (ing.daily_rdi as number) ?? rdiRef?.daily_rdi ?? null,
          ul: (ing.daily_ul as number) ?? rdiRef?.daily_ul ?? null,
          unit: (ing.rdi_unit as string) ?? rdiRef?.rdi_unit ?? null,
          linked: true,
          products: {},
        })
      }

      const item = ingredientMap.get(name)!
      item.products[pi.product_id as string] = {
        amount: (pi.amount as number) ?? null,
        rdi_pct: (pi.percentage_of_rdi as number) ?? null,
        included: true,
      }
    }

    // Parse raw_materials directly to find unlinked ingredients
    // (ingredients 테이블에 등록 안 된 원재료)
    const linkedNames = new Set(
      Array.from(ingredientMap.keys()).map((n) => n.toLowerCase())
    )

    for (const product of products) {
      if (!product.raw_materials) continue
      const rawNames = parseRawMaterials(product.raw_materials)

      for (const rawName of rawNames) {
        const lower = rawName.toLowerCase()
        // 이미 linked된 성분이면 스킵
        if (linkedNames.has(lower)) continue
        // 이미 unlinked로 추가된 성분인지 확인
        const existing = ingredientMap.get(rawName)
        if (existing) {
          if (!existing.products[product.id]) {
            existing.products[product.id] = { amount: null, rdi_pct: null, included: true }
          }
          continue
        }

        // 같은 이름이 다른 케이스로 이미 있는지 체크
        let found = false
        for (const [key, item] of ingredientMap) {
          if (key.toLowerCase() === lower) {
            if (!item.products[product.id]) {
              item.products[product.id] = { amount: null, rdi_pct: null, included: true }
            }
            found = true
            break
          }
        }
        if (found) continue

        // 새 unlinked 성분 추가
        ingredientMap.set(rawName, {
          ingredient: rawName,
          category: '원재료',
          rdi: null,
          ul: null,
          unit: null,
          linked: false,
          products: {
            [product.id]: { amount: null, rdi_pct: null, included: true },
          },
        })
      }
    }

    const response: ProductCompareResponse = {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company,
      })),
      comparison_table: Array.from(ingredientMap.values()).sort((a, b) => {
        // linked 성분 우선, 그 다음 카테고리순
        if (a.linked !== b.linked) return a.linked ? -1 : 1
        return a.category.localeCompare(b.category)
      }),
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
