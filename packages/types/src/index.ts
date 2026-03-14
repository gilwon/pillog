// ============================================
// @pillog/types — 웹/모바일 공유 TypeScript 타입 정의
// ============================================

/** 사용자 역할 */
export type UserRole = 'user' | 'admin'

/** 사용자 프로필 */
export interface UserProfile {
  id: string
  health_concerns: string[]
  role: UserRole
  updated_at: string
}

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
  is_active: boolean
  removed_from_api: boolean
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
  primary_effect: string | null
}

export interface DashboardWarning {
  ingredient: string
  message: string
  severity: 'info' | 'caution' | 'warning'
  rdi?: number | null
  unit?: string | null
}

/** 영양소 상호작용 타입 */
export type InteractionType = 'competition' | 'synergy' | 'interference'

/** 대시보드 상호작용 경고 */
export interface InteractionWarning {
  nutrients: string[]
  type: InteractionType
  severity: 'info' | 'caution' | 'warning'
  message: string
  recommendation?: string
}

/** AI 성분 설명 데이터 */
export interface ProductExplanationData {
  ingredients: {
    name: string
    summary: string
  }[]
  overall: string
}

/** 성분 설명 캐시 테이블 */
export interface ProductExplanation {
  id: string
  product_id: string
  explanation: ProductExplanationData
  model: string
  created_at: string
}

/** 공유 스냅샷 */
export type ShareType = 'supplements' | 'compare'

export interface SupplementShareData {
  supplements: {
    product_name: string
    company: string
    daily_dose: number
    ingredients: string[]
  }[]
  shared_at: string
}

export interface CompareShareData {
  products: { id: string; name: string; company: string }[]
  comparison_table: ComparisonItem[]
}

export interface ShareSnapshot {
  id: string
  user_id: string
  type: ShareType
  data: SupplementShareData | CompareShareData
  created_at: string
  expires_at: string
}

/** 복용 기록 */
export interface IntakeLog {
  id: string
  user_id: string
  product_id: string
  taken_date: string
  is_taken: boolean
  note: string | null
  created_at: string
}

// ============================================
// API Response Types
// ============================================

/** Pagination */
export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

/** Search response */
export interface ProductSearchResponse {
  data: ProductSearchResult[]
  pagination: Pagination
}

/** Product detail response */
export interface ProductDetailResponse extends ProductWithIngredients {
  disclaimer: string
}

/** Compare response */
export interface ProductCompareResponse {
  products: Pick<Product, 'id' | 'name' | 'company'>[]
  comparison_table: ComparisonItem[]
}

/** Dashboard response */
export interface DashboardResponse {
  supplements: {
    product_name: string
    daily_dose: number
  }[]
  total_nutrients: DashboardNutrient[]
  warnings: DashboardWarning[]
  interactions: InteractionWarning[]
}

/** User supplements response */
export interface UserSupplementsResponse {
  data: (UserSupplement & {
    product: Pick<Product, 'id' | 'name' | 'company' | 'shape' | 'functionality_tags'>
  })[]
}

/** API error response */
export interface ApiError {
  error: {
    code: string
    message: string
    status: number
  }
}

/** Error codes */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'PRODUCT_NOT_FOUND'
  | 'INGREDIENT_NOT_FOUND'
  | 'COMPARE_LIMIT'
  | 'SUPPLEMENT_DUPLICATE'
  | 'FAVORITE_DUPLICATE'
  | 'INTERNAL_ERROR'

// ============================================
// Barcode (Mobile)
// ============================================

/** 바코드 스캔 결과 */
export interface BarcodeScanResult {
  type: string   // 'org.gs1.EAN-13' | 'org.iso.QRCode' 등
  data: string   // 바코드 값 (예: "8801111234567")
}
