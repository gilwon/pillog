import type { ProductSearchResult, DashboardNutrient, DashboardWarning, InteractionWarning, ComparisonItem, ProductWithIngredients, UserSupplement, UserFavorite, Product, Ingredient, IngredientAlias } from './database'
export type { DashboardNutrient, DashboardWarning, InteractionWarning, ComparisonItem } from './database'

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

/** User favorites response */
export interface UserFavoritesResponse {
  data: (UserFavorite & {
    product: Pick<Product, 'id' | 'name' | 'company' | 'functionality_tags'>
  })[]
}

/** Intake today response */
export interface IntakeTodayItem {
  supplement_id: string
  product_id: string
  product_name: string
  is_taken: boolean
  ingredients: {
    name: string
    amount: number | null
    unit: string | null
  }[]
}

export interface IntakeTodayResponse {
  date: string
  supplements: IntakeTodayItem[]
  taken_count: number
  total_count: number
}

/** Intake history response */
export interface IntakeHistoryDay {
  date: string
  taken: number
  total: number
  pct: number
}

export interface IntakeHistoryResponse {
  year: number
  month: number
  days: IntakeHistoryDay[]
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
// Admin API Types
// ============================================

/** Admin product list item (lightweight, no large text fields) */
export type AdminProductListItem = Pick<Product, 'id' | 'report_no' | 'name' | 'company' | 'is_active' | 'removed_from_api' | 'reported_at' | 'synced_at' | 'created_at'>

/** Admin products list response */
export interface AdminProductsResponse {
  data: AdminProductListItem[]
  pagination: Pagination
}

/** Admin product detail response */
export interface AdminProductDetailResponse extends Product {
  ingredients: {
    id: string
    ingredient_id: string
    canonical_name: string
    amount: number | null
    amount_unit: string | null
    percentage_of_rdi: number | null
    is_functional: boolean
  }[]
}

/** Admin ingredients list response */
export interface AdminIngredientsResponse {
  data: Ingredient[]
  pagination: Pagination
}

/** Admin ingredient with aliases */
export interface AdminIngredientWithAliases extends Ingredient {
  aliases: IngredientAlias[]
}

/** Admin stats response */
export interface AdminStatsResponse {
  total_users: number
  total_products: number
  active_products: number
  total_ingredients: number
  recent_signups: number
  popular_products: {
    id: string
    name: string
    company: string
    user_count: number
  }[]
}

// ============================================
// Sync Log Types
// ============================================

export interface SyncLog {
  id: string
  sync_type: 'incremental' | 'full'
  change_date: string | null
  total_fetched: number
  new_count: number
  updated_count: number
  deactivated_count: number
  failed_batches: number
  status: 'running' | 'completed' | 'failed'
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface SyncLogProduct {
  id: string
  sync_log_id: string
  product_id: string
  change_type: 'new' | 'updated' | 'deactivated'
  product: { id: string; name: string; company: string; report_no: string }
}

export interface SyncLogsResponse {
  data: SyncLog[]
  pagination: Pagination
}

export interface SyncLogDetailResponse {
  log: SyncLog
  products: SyncLogProduct[]
  pagination: Pagination
}
