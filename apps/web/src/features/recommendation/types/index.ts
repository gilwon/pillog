export type HealthConcernKey =
  | '면역력'
  | '피로회복'
  | '피부건강'
  | '눈건강'
  | '뼈/관절'
  | '혈행개선'
  | '장건강'
  | '항산화'
  | '체중관리'
  | '스트레스'
  | '수면'
  | '간건강'
  | '남성건강'
  | '여성건강'
  | '어린이'

export interface HealthConcern {
  key: HealthConcernKey
  label: string
  emoji: string
  description: string
  keywords: string[]
}

export interface RecommendRequest {
  concerns: HealthConcernKey[]
}

export interface RecommendedProduct {
  id: string
  name: string
  company: string
  functionality_tags: string[]
  shape: string | null
  reported_at: string | null
  matchedTags: string[]
  matchScore: number
}

export interface RecommendResponse {
  products: RecommendedProduct[]
  total: number
}
