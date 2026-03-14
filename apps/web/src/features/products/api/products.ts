import { createClient } from '@/lib/supabase/server'
import type { ProductDetailResponse, ProductCompareResponse } from '@/types/api'
import type { ProductSearchResult } from '@/types/database'

/**
 * Full-text fuzzy search for products using pg_trgm.
 * Optionally filters by functionality_tags category.
 */
export async function searchProducts(
  query: string,
  options: { limit?: number; offset?: number; category?: string } = {}
): Promise<{ data: ProductSearchResult[]; total: number }> {
  const { limit = 20, offset = 0, category } = options
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_products', {
    query,
    lim: limit,
    off_set: offset,
  })

  if (error) throw error

  const { data: countData } = await supabase.rpc('count_search_products', { query })
  const total = Number(countData) || 0

  let results = (data || []) as Record<string, unknown>[]
  if (category && category.trim().length > 0) {
    results = results.filter((item) => {
      const tags = (item.functionality_tags as string[]) || []
      return tags.includes(category.trim())
    })
  }

  return {
    data: results.map((item) => ({
      id: item.id as string,
      name: item.name as string,
      company: item.company as string,
      functionality_tags: (item.functionality_tags as string[]) || [],
      shape: item.shape as string | null,
      similarity_score: Number(item.similarity_score) || 0,
    })),
    total: category ? results.length : total,
  }
}

/**
 * Fetch a single product with all related ingredients.
 */
export async function getProductById(id: string): Promise<ProductDetailResponse | null> {
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      ingredients:product_ingredients(
        *,
        ingredient:ingredients(*)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !product) return null

  const ingredients = ((product as Record<string, unknown>).ingredients as Record<string, unknown>[] || []).map(
    (pi: Record<string, unknown>) => {
      const ingredient = pi.ingredient as Record<string, unknown>
      return {
        id: ingredient.id as string,
        canonical_name: ingredient.canonical_name as string,
        description: ingredient.description as string | null,
        primary_effect: ingredient.primary_effect as string | null,
        daily_rdi: ingredient.daily_rdi as number | null,
        daily_ul: ingredient.daily_ul as number | null,
        rdi_unit: ingredient.rdi_unit as string | null,
        category: ingredient.category as string,
        product_id: pi.product_id as string,
        ingredient_id: pi.ingredient_id as string,
        amount: pi.amount as number | null,
        amount_unit: pi.amount_unit as string | null,
        percentage_of_rdi: pi.percentage_of_rdi as number | null,
        is_functional: pi.is_functional as boolean,
        created_at: pi.created_at as string,
      }
    }
  )

  return {
    ...(product as Record<string, unknown>),
    ingredients,
    disclaimer:
      '이 정보는 식약처 공공데이터를 기반으로 하며, 의학적 조언이 아닙니다.',
  } as unknown as ProductDetailResponse
}

/**
 * Fetch multiple products for the compare view (2–4 ids).
 */
export async function getProductsForCompare(ids: string[]): Promise<ProductCompareResponse> {
  if (ids.length < 2 || ids.length > 4) {
    throw new Error('COMPARE_LIMIT')
  }

  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, company')
    .in('id', ids)

  if (error) throw error

  const { data: piRows } = await supabase
    .from('product_ingredients')
    .select(
      `
      product_id, amount, amount_unit, percentage_of_rdi,
      ingredient:ingredients(id, canonical_name, category, daily_rdi, daily_ul, rdi_unit)
    `
    )
    .in('product_id', ids)

  const ingredientMap = new Map<
    string,
    {
      ingredient: string
      category: string
      rdi: number | null
      ul: number | null
      unit: string | null
      products: Record<string, { amount: number | null; rdi_pct: number | null }>
    }
  >()

  for (const row of piRows || []) {
    const r = row as Record<string, unknown>
    const ing = r.ingredient as Record<string, unknown>
    const name = ing.canonical_name as string

    if (!ingredientMap.has(name)) {
      ingredientMap.set(name, {
        ingredient: name,
        category: ing.category as string,
        rdi: (ing.daily_rdi as number | null) ?? null,
        ul: (ing.daily_ul as number | null) ?? null,
        unit: (ing.rdi_unit as string | null) ?? null,
        products: {},
      })
    }

    const entry = ingredientMap.get(name)!
    entry.products[r.product_id as string] = {
      amount: (r.amount as number | null) ?? null,
      rdi_pct: (r.percentage_of_rdi as number | null) ?? null,
    }
  }

  return {
    products: (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      company: p.company,
    })),
    comparison_table: Array.from(ingredientMap.values()),
  }
}
