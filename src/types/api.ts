import type { ProductSearchResult, DashboardNutrient, DashboardWarning, ComparisonItem, ProductWithIngredients, UserSupplement, UserFavorite, Product } from './database'
export type { DashboardNutrient, DashboardWarning, ComparisonItem } from './database'

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
}

/** User supplements response */
export interface UserSupplementsResponse {
  data: (UserSupplement & {
    product: Pick<Product, 'id' | 'name' | 'company' | 'shape'>
  })[]
}

/** User favorites response */
export interface UserFavoritesResponse {
  data: (UserFavorite & {
    product: Pick<Product, 'id' | 'name' | 'company' | 'functionality_tags'>
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
  | 'PRODUCT_NOT_FOUND'
  | 'INGREDIENT_NOT_FOUND'
  | 'COMPARE_LIMIT'
  | 'SUPPLEMENT_DUPLICATE'
  | 'FAVORITE_DUPLICATE'
  | 'INTERNAL_ERROR'
