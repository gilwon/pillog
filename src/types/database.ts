/** 건강기능식품 제품 */
export interface Product {
  id: string
  report_no: string
  name: string
  company: string
  primary_functionality: string
  functionality_tags: string[]
  how_to_take: string | null
  caution: string | null
  shape: string | null
  standard: string | null
  shelf_life: string | null
  storage_method: string | null
  raw_materials: string | null
  image_url: string | null
  reported_at: string | null
  synced_at: string
  created_at: string
  updated_at: string
}

/** 성분 (정규화된 원료) */
export interface Ingredient {
  id: string
  canonical_name: string
  category: string
  subcategory: string | null
  description: string | null
  primary_effect: string | null
  daily_rdi: number | null
  daily_ul: number | null
  rdi_unit: string | null
  source_info: string | null
  created_at: string
  updated_at: string
}

/** 성분명 별칭 (정규화 매핑) */
export interface IngredientAlias {
  id: string
  ingredient_id: string
  alias_name: string
  alias_type: 'scientific' | 'common' | 'brand' | 'abbreviation'
  created_at: string
}

/** 제품-성분 관계 */
export interface ProductIngredient {
  id: string
  product_id: string
  ingredient_id: string
  amount: number | null
  amount_unit: string | null
  percentage_of_rdi: number | null
  is_functional: boolean
  created_at: string
}

/** 사용자 복용 영양제 */
export interface UserSupplement {
  id: string
  user_id: string
  product_id: string
  daily_dose: number
  started_at: string | null
  note: string | null
  created_at: string
  updated_at: string
}

/** 사용자 즐겨찾기 */
export interface UserFavorite {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

/** 제품 검색 결과 항목 */
export interface ProductSearchResult {
  id: string
  name: string
  company: string
  functionality_tags: string[]
  shape: string | null
  similarity_score: number
}

/** 제품 상세 (성분 포함) */
export interface ProductWithIngredients extends Product {
  ingredients: (ProductIngredient & {
    canonical_name: string
    description: string | null
    primary_effect: string | null
    daily_rdi: number | null
    daily_ul: number | null
    rdi_unit: string | null
    category: string
  })[]
}

/** 비교 테이블 항목 */
export interface ComparisonItem {
  ingredient: string
  category: string
  rdi: number | null
  ul: number | null
  unit: string | null
  products: Record<string, { amount: number | null; rdi_pct: number | null }>
}

/** 대시보드 영양소 상태 */
export type NutrientStatus = 'safe' | 'caution' | 'warning'

export interface DashboardNutrient {
  ingredient: string
  category: string
  total_amount: number
  unit: string
  rdi: number | null
  ul: number | null
  rdi_percentage: number | null
  ul_percentage: number | null
  status: NutrientStatus
}

export interface DashboardWarning {
  ingredient: string
  message: string
  severity: 'caution' | 'warning'
}
