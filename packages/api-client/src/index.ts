// ============================================
// @pillog/api-client — 웹/모바일 공유 API 클라이언트
// Supabase 기반 공통 API 호출 함수
// ============================================

import { createClient } from '@supabase/supabase-js'
import type {
  Product,
  ProductSearchResult,
  ProductWithIngredients,
  ComparisonItem,
  UserSupplement,
} from '@pillog/types'

/** Postgres LIKE/ILIKE 와일드카드(%, _, \)를 이스케이프합니다. */
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}

// ============================================
// Supabase 클라이언트 팩토리
// (각 앱에서 환경변수를 주입해 초기화)
// ============================================

export function createPillogClient(supabaseUrl: string, supabaseAnonKey: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  return {
    // ----------------------------------------
    // 제품 검색
    // ----------------------------------------
    async searchProducts(
      query: string,
      options?: { category?: string; page?: number; limit?: number }
    ): Promise<{ data: ProductSearchResult[]; total: number }> {
      const { page = 1, limit = 20, category } = options ?? {}
      const offset = (page - 1) * limit

      let q = supabase
        .from('products')
        .select('id, name, company, functionality_tags, shape', { count: 'exact' })
        .eq('is_active', true)
        .ilike('name', `%${escapeLike(query)}%`)
        .range(offset, offset + limit - 1)

      if (category) {
        q = q.contains('functionality_tags', [category])
      }

      const { data, count, error } = await q
      if (error) throw error

      return {
        data: (data ?? []).map((p) => ({ ...p, similarity_score: 1 })),
        total: count ?? 0,
      }
    },

    // ----------------------------------------
    // 바코드로 제품 조회 (모바일 핵심 기능)
    // report_no 또는 바코드 값으로 검색
    // ----------------------------------------
    async getProductByBarcode(barcode: string): Promise<Product | null> {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('report_no', barcode)
        .eq('is_active', true)
        .single()

      if (error?.code === 'PGRST116') return null // not found
      if (error) throw error
      return data
    },

    // ----------------------------------------
    // 제품 상세 (성분 포함)
    // ----------------------------------------
    async getProduct(id: string): Promise<ProductWithIngredients | null> {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_ingredients (
            *,
            ingredients (
              canonical_name,
              description,
              primary_effect,
              daily_rdi,
              daily_ul,
              rdi_unit,
              category
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error?.code === 'PGRST116') return null
      if (error) throw error
      return data as unknown as ProductWithIngredients
    },

    // ----------------------------------------
    // 제품 비교
    // ----------------------------------------
    async compareProducts(ids: string[]): Promise<{
      products: Pick<Product, 'id' | 'name' | 'company'>[]
      comparison_table: ComparisonItem[]
    }> {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, company,
          product_ingredients (
            amount, amount_unit, percentage_of_rdi,
            ingredients (canonical_name, category, daily_rdi, daily_ul, rdi_unit)
          )
        `)
        .in('id', ids)

      if (error) throw error

      const products = (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company,
      }))

      // Build comparison table
      const ingredientMap = new Map<string, ComparisonItem>()
      for (const product of data ?? []) {
        for (const pi of (product as any).product_ingredients ?? []) {
          const ing = pi.ingredients
          if (!ing) continue
          const key = ing.canonical_name
          if (!ingredientMap.has(key)) {
            ingredientMap.set(key, {
              ingredient: ing.canonical_name,
              category: ing.category,
              rdi: ing.daily_rdi,
              ul: ing.daily_ul,
              unit: ing.rdi_unit,
              products: {},
            })
          }
          ingredientMap.get(key)!.products[product.id] = {
            amount: pi.amount,
            rdi_pct: pi.percentage_of_rdi,
          }
        }
      }

      return { products, comparison_table: Array.from(ingredientMap.values()) }
    },

    // ----------------------------------------
    // 내 영양제 목록
    // ----------------------------------------
    async getMySupplements(userId: string): Promise<UserSupplement[]> {
      const { data, error } = await supabase
        .from('user_supplements')
        .select('*, products(id, name, company, shape, functionality_tags)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },

    // ----------------------------------------
    // 영양제 추가
    // ----------------------------------------
    async addSupplement(
      userId: string,
      productId: string,
      dailyDose: number = 1
    ): Promise<import('@pillog/types').UserSupplement> {
      const { data, error } = await supabase
        .from('user_supplements')
        .insert({ user_id: userId, product_id: productId, daily_dose: dailyDose })
        .select()
        .single()

      if (error?.code === '23505') throw new Error('SUPPLEMENT_DUPLICATE')
      if (error) throw error
      return data
    },

    // ----------------------------------------
    // 영양제 삭제
    // ----------------------------------------
    async deleteSupplement(id: string, userId: string): Promise<void> {
      const { error } = await supabase
        .from('user_supplements')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    },

    // ----------------------------------------
    // 영양제 복용량 업데이트
    // ----------------------------------------
    async updateSupplement(
      id: string,
      userId: string,
      dailyDose: number
    ): Promise<import('@pillog/types').UserSupplement> {
      const { data, error } = await supabase
        .from('user_supplements')
        .update({ daily_dose: dailyDose })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    },
  }
}

export type PillogApiClient = ReturnType<typeof createPillogClient>
